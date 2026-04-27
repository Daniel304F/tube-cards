from datetime import datetime

from sqlmodel import SQLModel, Field


class BatchJob(SQLModel, table=True):
    __tablename__ = "batch_job"

    id: int | None = Field(default=None, primary_key=True)
    youtube_url: str
    status: str = Field(default="pending", index=True)
    error: str | None = Field(default=None)
    video_id: int | None = Field(default=None, foreign_key="video.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    started_at: datetime | None = Field(default=None)
    finished_at: datetime | None = Field(default=None)
