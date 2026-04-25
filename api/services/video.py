import json
import logging
from datetime import datetime

from fastapi import HTTPException
from sqlmodel import Session, select

from models.video import Video
from models.flashcard import Flashcard
from models.summary import Summary
from schemas.flashcard import FlashcardCreate
from schemas.summary import SummaryCreate
from schemas.video import VideoBatchItemResult, VideoProcessResponse, VideoRead
from schemas.flashcard import FlashcardRead
from schemas.summary import SummaryRead
from services import llm, transcript as transcript_service
from services import flashcard as flashcard_service
from services import summary as summary_service
from database import get_or_404

logger = logging.getLogger(__name__)

MAX_TRANSCRIPT_CHARS = 12_000

FLASHCARD_SYSTEM_PROMPT = (
    "You are an expert educator. Generate flashcards from the provided transcript. "
    "Each flashcard should test a key concept, fact, or idea from the content. "
    "Return ONLY valid JSON — an array of objects with 'question' and 'answer' keys. "
    "Generate between 5 and 15 flashcards depending on content density. "
    "Example: [{\"question\": \"What is X?\", \"answer\": \"X is...\"}]"
)

SUMMARY_SYSTEM_PROMPT = (
    "You are an expert educator. Write a clear, well-structured summary of the "
    "provided transcript. Use markdown formatting with headings and bullet points. "
    "Focus on the key ideas, arguments, and takeaways. Keep it concise but thorough."
)


def get_all(session: Session) -> list[Video]:
    return list(session.exec(select(Video)).all())


def get_by_id(session: Session, video_id: int) -> Video:
    return get_or_404(session, Video, video_id)


async def process(session: Session, youtube_url: str) -> VideoProcessResponse:
    """Full pipeline: fetch transcript → generate flashcards + summary → persist."""
    video_id_str = transcript_service.extract_video_id(youtube_url)
    logger.info("Processing video %s", video_id_str)

    transcript_text = transcript_service.fetch_transcript(video_id_str)
    title = transcript_service.fetch_video_title(video_id_str)

    if len(transcript_text) > MAX_TRANSCRIPT_CHARS:
        transcript_text = transcript_text[:MAX_TRANSCRIPT_CHARS]

    video = Video(
        youtube_url=youtube_url,
        title=title,
        transcript=transcript_text,
        processed_at=datetime.utcnow(),
    )
    session.add(video)
    session.commit()
    session.refresh(video)

    flashcards = await _generate_flashcards(session, video.id, transcript_text)
    summary = await _generate_summary(session, video.id, transcript_text)

    logger.info(
        "Processed video_id=%d: %d flashcards, 1 summary",
        video.id,
        len(flashcards),
    )

    return VideoProcessResponse(
        video=VideoRead.model_validate(video),
        flashcards=[FlashcardRead.model_validate(fc) for fc in flashcards],
        summary=SummaryRead.model_validate(summary),
    )


async def process_batch(
    session: Session, youtube_urls: list[str]
) -> list[VideoBatchItemResult]:
    """Process URLs sequentially. Failures don't stop the batch."""
    results: list[VideoBatchItemResult] = []
    for url in youtube_urls:
        try:
            result = await process(session, url)
            results.append(
                VideoBatchItemResult(youtube_url=url, success=True, result=result)
            )
        except Exception as e:
            logger.warning("Batch item failed for %s: %s", url, str(e))
            results.append(
                VideoBatchItemResult(youtube_url=url, success=False, error=str(e))
            )
    return results


async def _generate_flashcards(
    session: Session, video_id: int, transcript: str
) -> list[Flashcard]:
    """Call LLM to generate flashcards from transcript."""
    prompt = f"Generate flashcards from this transcript:\n\n{transcript}"
    raw_response = await llm.complete(prompt, system=FLASHCARD_SYSTEM_PROMPT)

    flashcard_data = _parse_flashcard_json(raw_response)

    items = [
        FlashcardCreate(question=fc["question"], answer=fc["answer"], video_id=video_id)
        for fc in flashcard_data
    ]
    return flashcard_service.create_many(session, items)


async def _generate_summary(
    session: Session, video_id: int, transcript: str
) -> Summary:
    """Call LLM to generate a summary from transcript."""
    prompt = f"Summarize this transcript:\n\n{transcript}"
    content = await llm.complete(prompt, system=SUMMARY_SYSTEM_PROMPT)

    data = SummaryCreate(content=content, video_id=video_id)
    return summary_service.create(session, data)


def _parse_flashcard_json(raw: str) -> list[dict[str, str]]:
    """Parse LLM response into a list of flashcard dicts."""
    cleaned = raw.strip()
    # LLM sometimes wraps in markdown code fences
    if cleaned.startswith("```"):
        lines = cleaned.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        cleaned = "\n".join(lines)

    try:
        data = json.loads(cleaned)
    except json.JSONDecodeError as e:
        logger.error("Failed to parse flashcard JSON: %s", str(e))
        raise HTTPException(
            status_code=502,
            detail="LLM returned invalid flashcard data. Please try again.",
        )

    if not isinstance(data, list):
        raise HTTPException(
            status_code=502,
            detail="LLM returned unexpected format. Please try again.",
        )

    result: list[dict[str, str]] = []
    for item in data:
        if isinstance(item, dict) and "question" in item and "answer" in item:
            result.append({"question": str(item["question"]), "answer": str(item["answer"])})

    if not result:
        raise HTTPException(
            status_code=502,
            detail="LLM did not generate any valid flashcards. Please try again.",
        )

    return result
