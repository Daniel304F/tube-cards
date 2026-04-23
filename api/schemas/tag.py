from datetime import datetime

from sqlmodel import SQLModel


class TagCreate(SQLModel):
    name: str
    color: str | None = None


class TagRead(SQLModel):
    id: int
    name: str
    color: str
    created_at: datetime


class TagUpdate(SQLModel):
    name: str | None = None
    color: str | None = None
