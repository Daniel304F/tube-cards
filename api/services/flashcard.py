import logging

from sqlmodel import Session, select

from models.flashcard import Flashcard
from schemas.flashcard import FlashcardCreate, FlashcardUpdate
from database import get_or_404

logger = logging.getLogger(__name__)


def get_all(
    session: Session,
    video_id: int | None = None,
    folder_id: int | None = None,
) -> list[Flashcard]:
    query = select(Flashcard)
    if video_id is not None:
        query = query.where(Flashcard.video_id == video_id)
    if folder_id is not None:
        query = query.where(Flashcard.folder_id == folder_id)
    return list(session.exec(query).all())


def get_by_id(session: Session, flashcard_id: int) -> Flashcard:
    return get_or_404(session, Flashcard, flashcard_id)


def create(session: Session, data: FlashcardCreate) -> Flashcard:
    flashcard = Flashcard.model_validate(data)
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return flashcard


def create_many(session: Session, items: list[FlashcardCreate]) -> list[Flashcard]:
    flashcards = [Flashcard.model_validate(item) for item in items]
    for fc in flashcards:
        session.add(fc)
    session.commit()
    for fc in flashcards:
        session.refresh(fc)
    return flashcards


def update(session: Session, flashcard_id: int, data: FlashcardUpdate) -> Flashcard:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    flashcard.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return flashcard


def delete(session: Session, flashcard_id: int) -> None:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    session.delete(flashcard)
    session.commit()
