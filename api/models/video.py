from datetime import datetime

from sqlmodel import SQLModel, Field


class Video(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    youtube_url: str
    title: str = ""
    transcript: str = ""
    processed_at: datetime | None = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
