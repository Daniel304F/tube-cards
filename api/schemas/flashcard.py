from datetime import datetime

from sqlmodel import SQLModel

from schemas.tag import TagRead


class FlashcardCreate(SQLModel):
    question: str
    answer: str
    video_id: int
    folder_id: int | None = None


class FlashcardRead(SQLModel):
    id: int
    question: str
    answer: str
    video_id: int
    folder_id: int | None
    created_at: datetime
    updated_at: datetime
    tags: list[TagRead] = []


class FlashcardUpdate(SQLModel):
    question: str | None = None
    answer: str | None = None
    folder_id: int | None = None
