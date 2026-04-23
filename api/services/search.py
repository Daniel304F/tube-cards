"""Full-text search across flashcards, summaries, and video titles.

Uses SQLite LIKE with case-insensitive collation. For a single-user,
small-dataset app this is fast enough; if the corpus grows, swap in FTS5.
"""
import logging
from sqlalchemy import or_
from sqlmodel import Session, select

from models.flashcard import Flashcard
from models.summary import Summary
from models.video import Video
from schemas.search import SearchHit, SearchHitType, SearchResults

logger = logging.getLogger(__name__)

SNIPPET_RADIUS: int = 80
MIN_QUERY_LENGTH: int = 2
DEFAULT_LIMIT: int = 25
MAX_LIMIT: int = 100


def _build_snippet(text: str, query: str) -> str:
    """Return a window around the first match of `query`, lowercase-insensitive."""
    if not text:
        return ""
    idx = text.lower().find(query.lower())
    if idx == -1:
        return text[: SNIPPET_RADIUS * 2].strip()
    start = max(0, idx - SNIPPET_RADIUS)
    end = min(len(text), idx + len(query) + SNIPPET_RADIUS)
    prefix = "…" if start > 0 else ""
    suffix = "…" if end < len(text) else ""
    return f"{prefix}{text[start:end].strip()}{suffix}"


def search(session: Session, query: str, limit: int = DEFAULT_LIMIT) -> SearchResults:
    query = query.strip()
    if len(query) < MIN_QUERY_LENGTH:
        return SearchResults(query=query, total=0, hits=[])

    limit = max(1, min(limit, MAX_LIMIT))
    pattern = f"%{query}%"
    hits: list[SearchHit] = []

    # Flashcards — match question or answer
    flashcard_rows = session.exec(
        select(Flashcard, Video)
        .join(Video, Flashcard.video_id == Video.id)
        .where(or_(Flashcard.question.ilike(pattern), Flashcard.answer.ilike(pattern)))  # type: ignore[attr-defined]
        .order_by(Flashcard.updated_at.desc())  # type: ignore[attr-defined]
        .limit(limit)
    ).all()
    for fc, video in flashcard_rows:
        assert fc.id is not None
        # Snippet: prefer the side that contained the match
        if query.lower() in fc.question.lower():
            snippet = _build_snippet(fc.answer, query) or fc.answer[:160]
        else:
            snippet = _build_snippet(fc.answer, query)
        hits.append(SearchHit(
            type=SearchHitType.FLASHCARD,
            id=fc.id,
            title=fc.question,
            snippet=snippet,
            video_id=fc.video_id,
            video_title=video.title or "Untitled",
            folder_id=fc.folder_id,
            created_at=fc.created_at,
        ))

    # Summaries — match content
    summary_rows = session.exec(
        select(Summary, Video)
        .join(Video, Summary.video_id == Video.id)
        .where(Summary.content.ilike(pattern))  # type: ignore[attr-defined]
        .order_by(Summary.updated_at.desc())  # type: ignore[attr-defined]
        .limit(limit)
    ).all()
    for summary, video in summary_rows:
        assert summary.id is not None
        hits.append(SearchHit(
            type=SearchHitType.SUMMARY,
            id=summary.id,
            title=f"Summary — {video.title or 'Untitled'}",
            snippet=_build_snippet(summary.content, query),
            video_id=summary.video_id,
            video_title=video.title or "Untitled",
            folder_id=summary.folder_id,
            created_at=summary.created_at,
        ))

    # Videos — match title
    video_rows = session.exec(
        select(Video)
        .where(Video.title.ilike(pattern))  # type: ignore[attr-defined]
        .order_by(Video.created_at.desc())  # type: ignore[attr-defined]
        .limit(limit)
    ).all()
    for video in video_rows:
        assert video.id is not None
        hits.append(SearchHit(
            type=SearchHitType.VIDEO,
            id=video.id,
            title=video.title or "Untitled",
            snippet=_build_snippet(video.transcript, query) if video.transcript else video.youtube_url,
            video_id=video.id,
            video_title=video.title or "Untitled",
            folder_id=None,
            created_at=video.created_at,
        ))

    hits.sort(key=lambda h: h.created_at, reverse=True)
    hits = hits[:limit]

    return SearchResults(query=query, total=len(hits), hits=hits)
