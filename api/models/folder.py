from datetime import datetime

from sqlmodel import SQLModel, Field


class Folder(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str
    parent_id: int | None = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
