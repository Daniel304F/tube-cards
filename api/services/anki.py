"""Anki .apkg export — builds a genanki package from a list of flashcards."""
import logging
import os
import tempfile

import genanki
from fastapi import HTTPException
from sqlmodel import Session

from database import get_or_404
from models.flashcard import Flashcard

logger = logging.getLogger(__name__)

# Stable IDs: re-imports merge into the same deck instead of duplicating.
TUBECARDS_DECK_ID = 2059400110
TUBECARDS_DECK_NAME = "TubeCards Export"


def export_flashcards(session: Session, flashcard_ids: list[int]) -> bytes:
    """Build an Anki .apkg package from the given flashcards. Returns the raw bytes."""
    if not flashcard_ids:
        raise HTTPException(status_code=422, detail="flashcard_ids must not be empty")

    flashcards = [get_or_404(session, Flashcard, fc_id) for fc_id in flashcard_ids]

    deck = genanki.Deck(TUBECARDS_DECK_ID, TUBECARDS_DECK_NAME)
    for fc in flashcards:
        deck.add_note(
            genanki.Note(
                model=genanki.BASIC_MODEL,
                fields=[fc.question, fc.answer],
            )
        )

    package = genanki.Package(deck)
    return _write_package_to_bytes(package)


def _write_package_to_bytes(package: genanki.Package) -> bytes:
    """genanki.Package.write_to_file expects a path; round-trip through a temp file."""
    fd, path = tempfile.mkstemp(suffix=".apkg")
    os.close(fd)
    try:
        package.write_to_file(path)
        with open(path, "rb") as f:
            return f.read()
    finally:
        if os.path.exists(path):
            os.unlink(path)
