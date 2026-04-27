from datetime import datetime

from sqlmodel import SQLModel


class BatchJobCreate(SQLModel):
    youtube_urls: list[str]


class BatchJobRead(SQLModel):
    id: int
    youtube_url: str
    status: str
    error: str | None
    video_id: int | None
    created_at: datetime
    started_at: datetime | None
    finished_at: datetime | None


class ClearFinishedResponse(SQLModel):
    deleted: int
