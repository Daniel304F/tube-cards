from datetime import datetime

from sqlmodel import SQLModel

from schemas.flashcard import FlashcardRead
from schemas.summary import SummaryRead


class VideoCreate(SQLModel):
    youtube_url: str


class VideoRead(SQLModel):
    id: int
    youtube_url: str
    title: str
    transcript: str
    processed_at: datetime | None
    created_at: datetime


class VideoUpdate(SQLModel):
    title: str | None = None
    folder_id: int | None = None


class VideoProcessRequest(SQLModel):
    youtube_url: str


class VideoProcessResponse(SQLModel):
    video: VideoRead
    flashcards: list[FlashcardRead]
    summary: SummaryRead


class VideoBatchRequest(SQLModel):
    youtube_urls: list[str]


class VideoBatchItemResult(SQLModel):
    youtube_url: str
    success: bool
    result: VideoProcessResponse | None = None
    error: str | None = None


class VideoBatchResponse(SQLModel):
    results: list[VideoBatchItemResult]
    success_count: int
    error_count: int
