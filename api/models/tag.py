from datetime import datetime

from sqlmodel import SQLModel, Field


DEFAULT_TAG_COLOR: str = "#10b981"  # brand-green


class Tag(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    color: str = Field(default=DEFAULT_TAG_COLOR)
    created_at: datetime = Field(default_factory=datetime.utcnow)
