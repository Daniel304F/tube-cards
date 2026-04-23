"""Tag CRUD and flashcard<->tag association."""
import logging

from fastapi import HTTPException
from sqlmodel import Session, select

from database import get_or_404
from models.flashcard import Flashcard
from models.flashcard_tag import FlashcardTag
from models.tag import Tag, DEFAULT_TAG_COLOR
from schemas.tag import TagCreate, TagUpdate

logger = logging.getLogger(__name__)


def _get_by_name(session: Session, name: str) -> Tag | None:
    return session.exec(select(Tag).where(Tag.name == name)).first()


def get_all(session: Session) -> list[Tag]:
    return list(session.exec(select(Tag).order_by(Tag.name)).all())  # type: ignore[attr-defined]


def get_by_id(session: Session, tag_id: int) -> Tag:
    return get_or_404(session, Tag, tag_id)


def create(session: Session, data: TagCreate) -> Tag:
    if _get_by_name(session, data.name) is not None:
        raise HTTPException(status_code=409, detail=f"Tag '{data.name}' already exists")

    tag = Tag(name=data.name, color=data.color or DEFAULT_TAG_COLOR)
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


def update(session: Session, tag_id: int, data: TagUpdate) -> Tag:
    tag = get_or_404(session, Tag, tag_id)

    if data.name is not None and data.name != tag.name:
        conflict = _get_by_name(session, data.name)
        if conflict is not None and conflict.id != tag_id:
            raise HTTPException(
                status_code=409, detail=f"Tag '{data.name}' already exists"
            )

    tag.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(tag)
    session.commit()
    session.refresh(tag)
    return tag


def delete(session: Session, tag_id: int) -> None:
    tag = get_or_404(session, Tag, tag_id)

    # Cascade: remove all flashcard-tag links first
    links = session.exec(
        select(FlashcardTag).where(FlashcardTag.tag_id == tag_id)
    ).all()
    for link in links:
        session.delete(link)

    session.delete(tag)
    session.commit()


def attach(session: Session, flashcard_id: int, tag_id: int) -> None:
    """Idempotent: attaching the same tag twice is a no-op."""
    get_or_404(session, Flashcard, flashcard_id)
    get_or_404(session, Tag, tag_id)

    existing = session.exec(
        select(FlashcardTag).where(
            FlashcardTag.flashcard_id == flashcard_id,
            FlashcardTag.tag_id == tag_id,
        )
    ).first()
    if existing is not None:
        return

    session.add(FlashcardTag(flashcard_id=flashcard_id, tag_id=tag_id))
    session.commit()


def detach(session: Session, flashcard_id: int, tag_id: int) -> None:
    """Idempotent: detaching a non-existing link is a no-op."""
    link = session.exec(
        select(FlashcardTag).where(
            FlashcardTag.flashcard_id == flashcard_id,
            FlashcardTag.tag_id == tag_id,
        )
    ).first()
    if link is None:
        return

    session.delete(link)
    session.commit()


def get_tags_for_flashcard(session: Session, flashcard_id: int) -> list[Tag]:
    rows = session.exec(
        select(Tag)
        .join(FlashcardTag, FlashcardTag.tag_id == Tag.id)  # type: ignore[arg-type]
        .where(FlashcardTag.flashcard_id == flashcard_id)
        .order_by(Tag.name)  # type: ignore[attr-defined]
    ).all()
    return list(rows)


def get_flashcard_ids_with_tag(session: Session, tag_id: int) -> list[int]:
    rows = session.exec(
        select(FlashcardTag.flashcard_id).where(FlashcardTag.tag_id == tag_id)
    ).all()
    return list(rows)
