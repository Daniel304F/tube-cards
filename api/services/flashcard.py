import logging

from sqlmodel import Session, select

from models.flashcard import Flashcard
from models.flashcard_tag import FlashcardTag
from schemas.flashcard import FlashcardCreate, FlashcardRead, FlashcardUpdate
from schemas.tag import TagRead
from database import get_or_404
from services import tag as tag_service

logger = logging.getLogger(__name__)


def _to_read(session: Session, flashcard: Flashcard) -> FlashcardRead:
    """Convert a Flashcard ORM object into a FlashcardRead with its tags."""
    assert flashcard.id is not None
    tags = tag_service.get_tags_for_flashcard(session, flashcard.id)
    return FlashcardRead(
        id=flashcard.id,
        question=flashcard.question,
        answer=flashcard.answer,
        video_id=flashcard.video_id,
        folder_id=flashcard.folder_id,
        created_at=flashcard.created_at,
        updated_at=flashcard.updated_at,
        tags=[TagRead.model_validate(t, from_attributes=True) for t in tags],
    )


def get_all(
    session: Session,
    video_id: int | None = None,
    folder_id: int | None = None,
    tag_id: int | None = None,
) -> list[FlashcardRead]:
    query = select(Flashcard)
    if video_id is not None:
        query = query.where(Flashcard.video_id == video_id)
    if folder_id is not None:
        query = query.where(Flashcard.folder_id == folder_id)
    if tag_id is not None:
        query = query.join(
            FlashcardTag, FlashcardTag.flashcard_id == Flashcard.id  # type: ignore[arg-type]
        ).where(FlashcardTag.tag_id == tag_id)

    rows = list(session.exec(query).all())
    return [_to_read(session, fc) for fc in rows]


def get_by_id(session: Session, flashcard_id: int) -> FlashcardRead:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    return _to_read(session, flashcard)


def create(session: Session, data: FlashcardCreate) -> FlashcardRead:
    flashcard = Flashcard.model_validate(data)
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return _to_read(session, flashcard)


def create_many(session: Session, items: list[FlashcardCreate]) -> list[Flashcard]:
    flashcards = [Flashcard.model_validate(item) for item in items]
    for fc in flashcards:
        session.add(fc)
    session.commit()
    for fc in flashcards:
        session.refresh(fc)
    return flashcards


def update(
    session: Session, flashcard_id: int, data: FlashcardUpdate
) -> FlashcardRead:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    flashcard.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return _to_read(session, flashcard)


def delete(session: Session, flashcard_id: int) -> None:
    flashcard = get_or_404(session, Flashcard, flashcard_id)

    # Cascade: remove FlashcardTag links so orphaned rows don't linger
    links = session.exec(
        select(FlashcardTag).where(FlashcardTag.flashcard_id == flashcard_id)
    ).all()
    for link in links:
        session.delete(link)

    session.delete(flashcard)
    session.commit()
