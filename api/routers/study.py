from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database import get_session
from schemas.study import ReviewRequest, ReviewResponse, StudyCard, StudyStats
from services import study as study_service

router = APIRouter(prefix="/study", tags=["study"])


@router.get("/due", response_model=list[StudyCard])
async def list_due_cards(
    folder_id: int | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=500),
    session: Session = Depends(get_session),
) -> list[StudyCard]:
    return study_service.get_due_cards(session, folder_id=folder_id, limit=limit)


@router.post("/review/{flashcard_id}", response_model=ReviewResponse)
async def review_card(
    flashcard_id: int,
    data: ReviewRequest,
    session: Session = Depends(get_session),
) -> ReviewResponse:
    flashcard = study_service.review(session, flashcard_id, data.quality)
    assert flashcard.id is not None and flashcard.last_reviewed is not None
    return ReviewResponse(
        id=flashcard.id,
        ease_factor=flashcard.ease_factor,
        interval=flashcard.interval,
        repetitions=flashcard.repetitions,
        due_date=flashcard.due_date,
        last_reviewed=flashcard.last_reviewed,
    )


@router.get("/stats", response_model=StudyStats)
async def get_study_stats(
    session: Session = Depends(get_session),
) -> StudyStats:
    return study_service.get_stats(session)
