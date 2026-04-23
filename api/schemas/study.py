from datetime import datetime
from enum import Enum

from sqlmodel import SQLModel


class ReviewQuality(str, Enum):
    """User-facing rating when reviewing a card."""

    AGAIN = "again"  # quality 1 — forgot, restart
    HARD = "hard"    # quality 3 — remembered with difficulty
    GOOD = "good"    # quality 4 — normal recall
    EASY = "easy"    # quality 5 — effortless


class StudyCard(SQLModel):
    id: int
    question: str
    answer: str
    video_id: int
    video_title: str
    folder_id: int | None
    ease_factor: float
    interval: int
    repetitions: int
    due_date: datetime
    last_reviewed: datetime | None


class ReviewRequest(SQLModel):
    quality: ReviewQuality


class ReviewResponse(SQLModel):
    id: int
    ease_factor: float
    interval: int
    repetitions: int
    due_date: datetime
    last_reviewed: datetime


class StudyStats(SQLModel):
    total_cards: int
    due_now: int
    learned_today: int
    new_cards: int       # never reviewed
    learning_cards: int  # in progress (0 < repetitions < 3)
    mature_cards: int    # repetitions >= 3
