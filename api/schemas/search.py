from datetime import datetime
from enum import Enum

from sqlmodel import SQLModel


class SearchHitType(str, Enum):
    FLASHCARD = "flashcard"
    SUMMARY = "summary"
    VIDEO = "video"


class SearchHit(SQLModel):
    type: SearchHitType
    id: int
    title: str            # primary line (flashcard question, summary "Summary", video title)
    snippet: str          # surrounding context with the match
    video_id: int
    video_title: str
    folder_id: int | None = None
    created_at: datetime


class SearchResults(SQLModel):
    query: str
    total: int
    hits: list[SearchHit]
