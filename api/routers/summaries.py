from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas.summary import SummaryRead, SummaryUpdate
from services import summary as summary_service

router = APIRouter(prefix="/summaries", tags=["summaries"])


@router.get("/", response_model=list[SummaryRead])
async def list_summaries(
    video_id: int | None = None,
    folder_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[SummaryRead]:
    return summary_service.get_all(session, video_id=video_id, folder_id=folder_id)


@router.get("/{summary_id}", response_model=SummaryRead)
async def get_summary(
    summary_id: int,
    session: Session = Depends(get_session),
) -> SummaryRead:
    return summary_service.get_by_id(session, summary_id)


@router.patch("/{summary_id}", response_model=SummaryRead)
async def update_summary(
    summary_id: int,
    data: SummaryUpdate,
    session: Session = Depends(get_session),
) -> SummaryRead:
    return summary_service.update(session, summary_id, data)


@router.delete("/{summary_id}", status_code=204)
async def delete_summary(
    summary_id: int,
    session: Session = Depends(get_session),
) -> None:
    summary_service.delete(session, summary_id)
