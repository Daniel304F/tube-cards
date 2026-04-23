from sqlmodel import SQLModel, Field


class FlashcardTag(SQLModel, table=True):
    """Association table: many-to-many between Flashcard and Tag."""

    flashcard_id: int = Field(foreign_key="flashcard.id", primary_key=True)
    tag_id: int = Field(foreign_key="tag.id", primary_key=True)
