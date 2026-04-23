"""Spaced repetition (SM-2) scheduling service."""
import logging
from datetime import datetime, timedelta

from sqlmodel import Session, select, func

from database import get_or_404
from models.flashcard import Flashcard
from models.video import Video
from schemas.study import ReviewQuality, StudyCard, StudyStats

logger = logging.getLogger(__name__)


QUALITY_MAP: dict[ReviewQuality, int] = {
    ReviewQuality.AGAIN: 1,
    ReviewQuality.HARD: 3,
    ReviewQuality.GOOD: 4,
    ReviewQuality.EASY: 5,
}

MIN_EASE_FACTOR: float = 1.3
MATURE_THRESHOLD: int = 3


def _apply_sm2(flashcard: Flashcard, quality_score: int) -> None:
    """Mutate the flashcard's SM-2 state in place for the given quality (0–5)."""
    if quality_score < 3:
        flashcard.repetitions = 0
        flashcard.interval = 1
    else:
        if flashcard.repetitions == 0:
            flashcard.interval = 1
        elif flashcard.repetitions == 1:
            flashcard.interval = 6
        else:
            flashcard.interval = max(1, round(flashcard.interval * flashcard.ease_factor))
        flashcard.repetitions += 1

    delta = 0.1 - (5 - quality_score) * (0.08 + (5 - quality_score) * 0.02)
    flashcard.ease_factor = max(MIN_EASE_FACTOR, flashcard.ease_factor + delta)

    now = datetime.utcnow()
    flashcard.last_reviewed = now
    flashcard.due_date = now + timedelta(days=flashcard.interval)
    flashcard.updated_at = now


def _to_study_card(flashcard: Flashcard, video_title: str) -> StudyCard:
    assert flashcard.id is not None
    return StudyCard(
        id=flashcard.id,
        question=flashcard.question,
        answer=flashcard.answer,
        video_id=flashcard.video_id,
        video_title=video_title,
        folder_id=flashcard.folder_id,
        ease_factor=flashcard.ease_factor,
        interval=flashcard.interval,
        repetitions=flashcard.repetitions,
        due_date=flashcard.due_date,
        last_reviewed=flashcard.last_reviewed,
    )


def get_due_cards(
    session: Session,
    folder_id: int | None = None,
    limit: int | None = None,
) -> list[StudyCard]:
    """Return cards whose due_date is now or in the past, oldest first."""
    now = datetime.utcnow()
    query = select(Flashcard, Video).join(Video, Flashcard.video_id == Video.id)
    query = query.where(Flashcard.due_date <= now)
    if folder_id is not None:
        query = query.where(Flashcard.folder_id == folder_id)
    query = query.order_by(Flashcard.due_date)
    if limit is not None:
        query = query.limit(limit)

    results = session.exec(query).all()
    return [_to_study_card(fc, v.title or "Untitled") for fc, v in results]


def review(session: Session, flashcard_id: int, quality: ReviewQuality) -> Flashcard:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    _apply_sm2(flashcard, QUALITY_MAP[quality])
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    logger.info(
        "Reviewed flashcard %d with %s → interval=%d days, ease=%.2f",
        flashcard_id, quality.value, flashcard.interval, flashcard.ease_factor,
    )
    return flashcard


def get_stats(session: Session) -> StudyStats:
    now = datetime.utcnow()
    start_of_day = datetime(now.year, now.month, now.day)

    total: int = session.exec(select(func.count()).select_from(Flashcard)).one()
    due: int = session.exec(
        select(func.count()).select_from(Flashcard).where(Flashcard.due_date <= now)
    ).one()
    learned_today: int = session.exec(
        select(func.count()).select_from(Flashcard).where(Flashcard.last_reviewed >= start_of_day)
    ).one()
    new_cards: int = session.exec(
        select(func.count()).select_from(Flashcard).where(Flashcard.repetitions == 0)
    ).one()
    learning: int = session.exec(
        select(func.count()).select_from(Flashcard).where(
            Flashcard.repetitions > 0, Flashcard.repetitions < MATURE_THRESHOLD
        )
    ).one()
    mature: int = session.exec(
        select(func.count()).select_from(Flashcard).where(Flashcard.repetitions >= MATURE_THRESHOLD)
    ).one()

    return StudyStats(
        total_cards=total,
        due_now=due,
        learned_today=learned_today,
        new_cards=new_cards,
        learning_cards=learning,
        mature_cards=mature,
    )
