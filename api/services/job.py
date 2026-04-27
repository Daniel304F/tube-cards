"""Persistent batch-job queue. Pure DB operations — no async work here."""
from datetime import datetime

from sqlmodel import Session, select

from models.batch_job import BatchJob

STATUS_PENDING = "pending"
STATUS_RUNNING = "running"
STATUS_DONE = "done"
STATUS_FAILED = "failed"

FINISHED_STATUSES = (STATUS_DONE, STATUS_FAILED)


def create_jobs(session: Session, youtube_urls: list[str]) -> list[BatchJob]:
    """Insert one pending job per URL."""
    jobs = [BatchJob(youtube_url=url) for url in youtube_urls]
    for job in jobs:
        session.add(job)
    session.commit()
    for job in jobs:
        session.refresh(job)
    return jobs


def list_jobs(session: Session, status: str | None = None) -> list[BatchJob]:
    query = select(BatchJob).order_by(BatchJob.created_at)
    if status:
        query = query.where(BatchJob.status == status)
    return list(session.exec(query).all())


def get_next_pending(session: Session) -> BatchJob | None:
    query = (
        select(BatchJob)
        .where(BatchJob.status == STATUS_PENDING)
        .order_by(BatchJob.created_at)
        .limit(1)
    )
    return session.exec(query).first()


def mark_running(session: Session, job: BatchJob) -> None:
    job.status = STATUS_RUNNING
    job.started_at = datetime.utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)


def mark_done(session: Session, job: BatchJob, video_id: int) -> None:
    job.status = STATUS_DONE
    job.video_id = video_id
    job.finished_at = datetime.utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)


def mark_failed(session: Session, job: BatchJob, error: str) -> None:
    job.status = STATUS_FAILED
    job.error = error
    job.finished_at = datetime.utcnow()
    session.add(job)
    session.commit()
    session.refresh(job)


def delete_job(session: Session, job_id: int) -> None:
    job = session.get(BatchJob, job_id)
    if job:
        session.delete(job)
        session.commit()


def clear_finished(session: Session) -> int:
    jobs = list(
        session.exec(select(BatchJob).where(BatchJob.status.in_(FINISHED_STATUSES))).all()
    )
    for job in jobs:
        session.delete(job)
    session.commit()
    return len(jobs)


def reset_running_to_pending(session: Session) -> int:
    """Crash-recovery: any job left in `running` after a restart goes back to `pending`."""
    jobs = list(session.exec(select(BatchJob).where(BatchJob.status == STATUS_RUNNING)).all())
    for job in jobs:
        job.status = STATUS_PENDING
        job.started_at = None
        session.add(job)
    session.commit()
    return len(jobs)
