from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import get_session
from schemas.batch_job import BatchJobCreate, BatchJobRead, ClearFinishedResponse
from services import job as job_service

router = APIRouter(prefix="/jobs", tags=["jobs"])


@router.post("/", response_model=list[BatchJobRead], status_code=201)
async def create_jobs(
    data: BatchJobCreate,
    session: Session = Depends(get_session),
) -> list[BatchJobRead]:
    if not data.youtube_urls:
        raise HTTPException(status_code=422, detail="youtube_urls must not be empty")
    return job_service.create_jobs(session, data.youtube_urls)


@router.get("/", response_model=list[BatchJobRead])
async def list_jobs(
    status: str | None = None,
    session: Session = Depends(get_session),
) -> list[BatchJobRead]:
    return job_service.list_jobs(session, status=status)


@router.delete("/finished", response_model=ClearFinishedResponse)
async def clear_finished(
    session: Session = Depends(get_session),
) -> ClearFinishedResponse:
    deleted = job_service.clear_finished(session)
    return ClearFinishedResponse(deleted=deleted)


@router.delete("/{job_id}", status_code=204)
async def delete_job(
    job_id: int,
    session: Session = Depends(get_session),
) -> None:
    job_service.delete_job(session, job_id)
