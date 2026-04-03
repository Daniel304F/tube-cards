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
