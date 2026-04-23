from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas.tag import TagCreate, TagRead, TagUpdate
from services import tag as tag_service

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("/", response_model=list[TagRead])
async def list_tags(
    session: Session = Depends(get_session),
) -> list[TagRead]:
    return tag_service.get_all(session)


@router.get("/{tag_id}", response_model=TagRead)
async def get_tag(
    tag_id: int,
    session: Session = Depends(get_session),
) -> TagRead:
    return tag_service.get_by_id(session, tag_id)


@router.post("/", response_model=TagRead, status_code=201)
async def create_tag(
    data: TagCreate,
    session: Session = Depends(get_session),
) -> TagRead:
    return tag_service.create(session, data)


@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: int,
    data: TagUpdate,
    session: Session = Depends(get_session),
) -> TagRead:
    return tag_service.update(session, tag_id, data)


@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: int,
    session: Session = Depends(get_session),
) -> None:
    tag_service.delete(session, tag_id)
