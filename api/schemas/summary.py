from datetime import datetime

from sqlmodel import SQLModel


class SummaryCreate(SQLModel):
    content: str
    video_id: int
    folder_id: int | None = None


class SummaryRead(SQLModel):
    id: int
    content: str
    video_id: int
    folder_id: int | None
    created_at: datetime
    updated_at: datetime


class SummaryUpdate(SQLModel):
    content: str | None = None
    folder_id: int | None = None
