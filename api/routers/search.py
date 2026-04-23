from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from database import get_session
from schemas.search import SearchResults
from services import search as search_service

router = APIRouter(prefix="/search", tags=["search"])


@router.get("/", response_model=SearchResults)
async def search_all(
    q: str = Query(..., min_length=1, max_length=200, description="Search query"),
    limit: int = Query(default=25, ge=1, le=100),
    session: Session = Depends(get_session),
) -> SearchResults:
    return search_service.search(session, q, limit=limit)
