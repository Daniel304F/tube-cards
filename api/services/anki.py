"""Anki .apkg export — stub. Implementation lives in step 2 of the TDD cycle."""
from sqlmodel import Session


def export_flashcards(session: Session, flashcard_ids: list[int]) -> bytes:
    raise NotImplementedError("anki_service.export_flashcards is not implemented yet")
