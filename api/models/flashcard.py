from datetime import datetime

from sqlmodel import SQLModel, Field


class Flashcard(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    question: str
    answer: str
    video_id: int = Field(foreign_key="video.id")
    folder_id: int | None = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    # SM-2 spaced repetition state
    ease_factor: float = Field(default=2.5)
    interval: int = Field(default=0)
    repetitions: int = Field(default=0)
    due_date: datetime = Field(default_factory=datetime.utcnow)
    last_reviewed: datetime | None = Field(default=None)
