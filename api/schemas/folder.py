from datetime import datetime

from sqlmodel import SQLModel


class FolderCreate(SQLModel):
    name: str
    parent_id: int | None = None


class FolderRead(SQLModel):
    id: int
    name: str
    parent_id: int | None
    created_at: datetime


class FolderUpdate(SQLModel):
    name: str | None = None
    parent_id: int | None = None
