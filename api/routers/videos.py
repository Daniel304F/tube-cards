from fastapi import APIRouter, Depends
from sqlmodel import Session

from database import get_session
from schemas.video import VideoRead, VideoProcessRequest, VideoProcessResponse
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
