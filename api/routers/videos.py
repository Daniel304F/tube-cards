from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from database import get_session
from schemas.video import (
    VideoBatchRequest,
    VideoBatchResponse,
    VideoProcessRequest,
    VideoProcessResponse,
    VideoRead,
)
from services import video as video_service

router = APIRouter(prefix="/videos", tags=["videos"])


@router.get("/", response_model=list[VideoRead])
async def list_videos(
    session: Session = Depends(get_session),
) -> list[VideoRead]:
    return video_service.get_all(session)


@router.get("/{video_id}", response_model=VideoRead)
async def get_video(
    video_id: int,
    session: Session = Depends(get_session),
) -> VideoRead:
    return video_service.get_by_id(session, video_id)


@router.post("/process", response_model=VideoProcessResponse, status_code=201)
async def process_video(
    data: VideoProcessRequest,
    session: Session = Depends(get_session),
) -> VideoProcessResponse:
    return await video_service.process(session, data.youtube_url)


@router.post("/process-batch", response_model=VideoBatchResponse, status_code=201)
async def process_videos_batch(
    data: VideoBatchRequest,
    session: Session = Depends(get_session),
) -> VideoBatchResponse:
    if not data.youtube_urls:
        raise HTTPException(status_code=422, detail="youtube_urls must not be empty")
    results = await video_service.process_batch(session, data.youtube_urls)
    return VideoBatchResponse(
        results=results,
        success_count=sum(1 for r in results if r.success),
        error_count=sum(1 for r in results if not r.success),
    )
