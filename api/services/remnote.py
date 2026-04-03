import logging

import httpx
from fastapi import HTTPException
from sqlmodel import Session

from core.config import settings
from models.flashcard import Flashcard
from models.summary import Summary
from database import get_or_404

logger = logging.getLogger(__name__)

REMNOTE_API_URL = "https://api.remnote.com/v0"


def _get_headers() -> dict[str, str]:
    if not settings.remnote_api_key:
        raise HTTPException(status_code=400, detail="Remnote API key not configured")
    return {
        "Authorization": f"Bearer {settings.remnote_api_key}",
        "Content-Type": "application/json",
    }


def export_to_remnote(
    session: Session,
    flashcard_ids: list[int],
    summary_ids: list[int],
) -> tuple[int, int]:
    """Export flashcards and summaries to Remnote."""
    headers = _get_headers()
    exported_fc = 0
    exported_sum = 0

    for fc_id in flashcard_ids:
        flashcard = get_or_404(session, Flashcard, fc_id)
        payload = {
            "text": flashcard.question,
            "backText": flashcard.answer,
            "isFlashcard": True,
        }
        try:
            response = httpx.post(
                f"{REMNOTE_API_URL}/document/create",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            exported_fc += 1
        except httpx.HTTPError as e:
            logger.error("Remnote export failed for flashcard %d: %s", fc_id, str(e))

    for sum_id in summary_ids:
        summary = get_or_404(session, Summary, sum_id)
        payload = {
            "text": f"Summary (video {summary.video_id})",
            "content": summary.content,
            "isFlashcard": False,
        }
        try:
            response = httpx.post(
                f"{REMNOTE_API_URL}/document/create",
                json=payload,
                headers=headers,
                timeout=30,
            )
            response.raise_for_status()
            exported_sum += 1
        except httpx.HTTPError as e:
            logger.error("Remnote export failed for summary %d: %s", sum_id, str(e))

    return exported_fc, exported_sum
