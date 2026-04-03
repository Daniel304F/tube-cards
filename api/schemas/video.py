from datetime import datetime

from sqlmodel import SQLModel


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
