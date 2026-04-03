from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas.export import ExportRequest, ExportResponse
from services import notion as notion_service
from services import remnote as remnote_service
from core.config import settings

router = APIRouter(prefix="/export", tags=["export"])


@router.post("/notion", response_model=ExportResponse)
async def export_to_notion(
    data: ExportRequest,
    session: Session = Depends(get_session),
) -> ExportResponse:
    exported_fc, exported_sum = notion_service.export_to_notion(
        session,
        database_id=settings.notion_database_id,
        flashcard_ids=data.flashcard_ids,
        summary_ids=data.summary_ids,
    )
    return ExportResponse(
        exported_flashcards=exported_fc,
        exported_summaries=exported_sum,
        message=f"Exported {exported_fc} flashcards and {exported_sum} summaries to Notion.",
    )


@router.post("/remnote", response_model=ExportResponse)
async def export_to_remnote(
    data: ExportRequest,
    session: Session = Depends(get_session),
) -> ExportResponse:
    exported_fc, exported_sum = remnote_service.export_to_remnote(
        session,
        flashcard_ids=data.flashcard_ids,
        summary_ids=data.summary_ids,
    )
    return ExportResponse(
        exported_flashcards=exported_fc,
        exported_summaries=exported_sum,
        message=f"Exported {exported_fc} flashcards and {exported_sum} summaries to Remnote.",
    )
