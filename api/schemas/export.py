from sqlmodel import SQLModel


class ExportRequest(SQLModel):
    flashcard_ids: list[int] = []
    summary_ids: list[int] = []


class ExportResponse(SQLModel):
    exported_flashcards: int
    exported_summaries: int
    message: str
