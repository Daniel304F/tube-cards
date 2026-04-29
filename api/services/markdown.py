"""Markdown export — builds a single .md file grouped by video."""
import logging
from collections import defaultdict

from fastapi import HTTPException
from sqlmodel import Session

from database import get_or_404
from models.flashcard import Flashcard
from models.summary import Summary
from models.video import Video

logger = logging.getLogger(__name__)

MARKDOWN_MEDIA_TYPE = "text/markdown; charset=utf-8"


def export(
    session: Session,
    flashcard_ids: list[int],
    summary_ids: list[int],
) -> bytes:
    """Render flashcards and summaries as a single Markdown document.

    Output is grouped by video so flashcards from the same video stay together,
    even when the caller passes mixed ids in arbitrary order. Videos appear in
    the order they first show up in the inputs (flashcards first, then summaries).
    """
    if not flashcard_ids and not summary_ids:
        raise HTTPException(
            status_code=422,
            detail="At least one flashcard_id or summary_id is required",
        )

    flashcards = [get_or_404(session, Flashcard, fc_id) for fc_id in flashcard_ids]
    summaries = [get_or_404(session, Summary, s_id) for s_id in summary_ids]

    video_order: list[int] = []
    cards_by_video: dict[int, list[Flashcard]] = defaultdict(list)
    summaries_by_video: dict[int, list[Summary]] = defaultdict(list)

    def _track(video_id: int) -> None:
        if video_id not in video_order:
            video_order.append(video_id)

    for fc in flashcards:
        _track(fc.video_id)
        cards_by_video[fc.video_id].append(fc)
    for s in summaries:
        _track(s.video_id)
        summaries_by_video[s.video_id].append(s)

    lines: list[str] = []
    for video_id in video_order:
        video = get_or_404(session, Video, video_id)
        lines.append(f"# {video.title}")
        lines.append("")

        for summary in summaries_by_video.get(video_id, []):
            lines.append("## Summary")
            lines.append("")
            lines.append(summary.content)
            lines.append("")

        cards = cards_by_video.get(video_id, [])
        if cards:
            lines.append("## Flashcards")
            lines.append("")
            for fc in cards:
                lines.append(f"### Q: {fc.question}")
                lines.append("")
                lines.append(fc.answer)
                lines.append("")

    return "\n".join(lines).encode("utf-8")
