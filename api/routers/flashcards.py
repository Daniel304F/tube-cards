from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas.flashcard import FlashcardCreate, FlashcardRead, FlashcardUpdate
from services import flashcard as flashcard_service

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.get("/", response_model=list[FlashcardRead])
async def list_flashcards(
    video_id: int | None = None,
    folder_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[FlashcardRead]:
    return flashcard_service.get_all(session, video_id=video_id, folder_id=folder_id)


@router.get("/{flashcard_id}", response_model=FlashcardRead)
async def get_flashcard(
    flashcard_id: int,
    session: Session = Depends(get_session),
) -> FlashcardRead:
    return flashcard_service.get_by_id(session, flashcard_id)


@router.post("/", response_model=FlashcardRead, status_code=201)
async def create_flashcard(
    data: FlashcardCreate,
    session: Session = Depends(get_session),
) -> FlashcardRead:
    return flashcard_service.create(session, data)


@router.patch("/{flashcard_id}", response_model=FlashcardRead)
async def update_flashcard(
    flashcard_id: int,
    data: FlashcardUpdate,
    session: Session = Depends(get_session),
) -> FlashcardRead:
    return flashcard_service.update(session, flashcard_id, data)


@router.delete("/{flashcard_id}", status_code=204)
async def delete_flashcard(
    flashcard_id: int,
    session: Session = Depends(get_session),
) -> None:
    flashcard_service.delete(session, flashcard_id)
