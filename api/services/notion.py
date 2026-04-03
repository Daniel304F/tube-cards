import logging

import httpx
from fastapi import HTTPException
from sqlmodel import Session

from core.config import settings
from models.flashcard import Flashcard
from models.summary import Summary
from database import get_or_404

logger = logging.getLogger(__name__)

NOTION_API_URL = "https://api.notion.com/v1/pages"
NOTION_API_VERSION = "2022-06-28"


def _get_headers() -> dict[str, str]:
    if not settings.notion_api_key:
        raise HTTPException(status_code=400, detail="Notion API key not configured")
    return {
        "Authorization": f"Bearer {settings.notion_api_key}",
        "Content-Type": "application/json",
        "Notion-Version": NOTION_API_VERSION,
    }


def _build_flashcard_blocks(flashcard: Flashcard) -> list[dict[str, object]]:
    return [
        {
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{"type": "text", "text": {"content": "Question"}}],
            },
        },
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": flashcard.question}}],
            },
        },
        {
            "object": "block",
            "type": "heading_3",
            "heading_3": {
                "rich_text": [{"type": "text", "text": {"content": "Answer"}}],
            },
        },
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": flashcard.answer}}],
            },
        },
        {
            "object": "block",
            "type": "divider",
            "divider": {},
        },
    ]


def _build_summary_blocks(summary: Summary) -> list[dict[str, object]]:
    return [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {
                "rich_text": [{"type": "text", "text": {"content": summary.content[:2000]}}],
            },
        },
    ]


def export_to_notion(
    session: Session,
    database_id: str,
    flashcard_ids: list[int],
    summary_ids: list[int],
) -> tuple[int, int]:
    """Export flashcards and summaries to a Notion database."""
    headers = _get_headers()
    exported_fc = 0
    exported_sum = 0

    for fc_id in flashcard_ids:
        flashcard = get_or_404(session, Flashcard, fc_id)
        payload: dict[str, object] = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {
                    "title": [{"text": {"content": flashcard.question[:100]}}],
                },
                "Type": {
                    "select": {"name": "Flashcard"},
                },
            },
            "children": _build_flashcard_blocks(flashcard),
        }
        try:
            response = httpx.post(NOTION_API_URL, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            exported_fc += 1
        except httpx.HTTPError as e:
            logger.error("Notion export failed for flashcard %d: %s", fc_id, str(e))

    for sum_id in summary_ids:
        summary = get_or_404(session, Summary, sum_id)
        payload = {
            "parent": {"database_id": database_id},
            "properties": {
                "Name": {
                    "title": [{"text": {"content": f"Summary (video {summary.video_id})"}}],
                },
                "Type": {
                    "select": {"name": "Summary"},
                },
            },
            "children": _build_summary_blocks(summary),
        }
        try:
            response = httpx.post(NOTION_API_URL, json=payload, headers=headers, timeout=30)
            response.raise_for_status()
            exported_sum += 1
        except httpx.HTTPError as e:
            logger.error("Notion export failed for summary %d: %s", sum_id, str(e))

    return exported_fc, exported_sum
