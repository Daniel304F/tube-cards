from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas.folder import FolderCreate, FolderRead, FolderUpdate
from services import folder as folder_service

router = APIRouter(prefix="/folders", tags=["folders"])


@router.get("/", response_model=list[FolderRead])
async def list_folders(
    parent_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[FolderRead]:
    return folder_service.get_all(session, parent_id=parent_id)


@router.get("/{folder_id}", response_model=FolderRead)
async def get_folder(
    folder_id: int,
    session: Session = Depends(get_session),
) -> FolderRead:
    return folder_service.get_by_id(session, folder_id)


@router.post("/", response_model=FolderRead, status_code=201)
async def create_folder(
    data: FolderCreate,
    session: Session = Depends(get_session),
) -> FolderRead:
    return folder_service.create(session, data)


@router.patch("/{folder_id}", response_model=FolderRead)
async def update_folder(
    folder_id: int,
    data: FolderUpdate,
    session: Session = Depends(get_session),
) -> FolderRead:
    return folder_service.update(session, folder_id, data)


@router.delete("/{folder_id}", status_code=204)
async def delete_folder(
    folder_id: int,
    session: Session = Depends(get_session),
) -> None:
    folder_service.delete(session, folder_id)
