"""Background worker that drains the BatchJob queue one item at a time."""
import asyncio
import logging

from sqlmodel import Session

from database import engine
from services import job as job_service
from services import video as video_service

logger = logging.getLogger(__name__)

POLL_INTERVAL_SECONDS = 3.0


async def process_one(session: Session) -> bool:
    """Process the next pending job. Returns True if one was processed, else False."""
    job = job_service.get_next_pending(session)
    if not job:
        return False

    job_service.mark_running(session, job)
    try:
        result = await video_service.process(session, job.youtube_url)
        job_service.mark_done(session, job, video_id=result.video.id)
        logger.info("Job %d done — video_id=%d", job.id, result.video.id)
    except Exception as e:
        job_service.mark_failed(session, job, str(e))
        logger.warning("Job %d failed: %s", job.id, str(e))
    return True


async def worker_loop() -> None:
    """Run forever: drain pending jobs, then sleep, then drain again."""
    logger.info("Job worker started")
    while True:
        try:
            with Session(engine) as session:
                processed = await process_one(session)
            if not processed:
                await asyncio.sleep(POLL_INTERVAL_SECONDS)
        except asyncio.CancelledError:
            logger.info("Job worker stopped")
            raise
        except Exception as e:
            logger.exception("Worker loop error: %s", str(e))
            await asyncio.sleep(POLL_INTERVAL_SECONDS)
