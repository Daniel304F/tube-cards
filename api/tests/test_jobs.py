"""Tests for the persistent batch-job queue."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from models.batch_job import BatchJob
from services import job as job_service
from services import job_worker
from services import video as video_service
from schemas.summary import SummaryRead
from schemas.video import VideoProcessResponse, VideoRead


def _fake_response(url: str, video_id: int = 1) -> VideoProcessResponse:
    from datetime import datetime

    now = datetime.utcnow()
    return VideoProcessResponse(
        video=VideoRead(
            id=video_id, youtube_url=url, title="T", transcript="x",
            processed_at=now, created_at=now,
        ),
        flashcards=[],
        summary=SummaryRead(
            id=1, content="s", video_id=video_id, folder_id=None,
            created_at=now, updated_at=now,
        ),
    )


class TestJobService:
    def test_create_jobs_persists_one_per_url(self, session: Session) -> None:
        urls = ["https://youtu.be/a", "https://youtu.be/b"]

        jobs = job_service.create_jobs(session, urls)

        assert len(jobs) == 2
        assert all(j.status == "pending" for j in jobs)

    def test_list_filters_by_status(self, session: Session) -> None:
        job_service.create_jobs(session, ["https://youtu.be/a"])
        done = job_service.create_jobs(session, ["https://youtu.be/b"])[0]
        job_service.mark_done(session, done, video_id=1)

        pending = job_service.list_jobs(session, status="pending")
        finished = job_service.list_jobs(session, status="done")

        assert len(pending) == 1
        assert len(finished) == 1

    def test_get_next_pending_returns_oldest(self, session: Session) -> None:
        first = job_service.create_jobs(session, ["https://youtu.be/a"])[0]
        job_service.create_jobs(session, ["https://youtu.be/b"])

        nxt = job_service.get_next_pending(session)

        assert nxt is not None
        assert nxt.id == first.id

    def test_get_next_pending_skips_running(self, session: Session) -> None:
        first = job_service.create_jobs(session, ["https://youtu.be/a"])[0]
        second = job_service.create_jobs(session, ["https://youtu.be/b"])[0]
        job_service.mark_running(session, first)

        nxt = job_service.get_next_pending(session)

        assert nxt is not None
        assert nxt.id == second.id

    def test_mark_running_sets_started_at(self, session: Session) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        job_service.mark_running(session, job)

        assert job.status == "running"
        assert job.started_at is not None

    def test_mark_done_sets_video_id_and_finished_at(self, session: Session) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        job_service.mark_done(session, job, video_id=42)

        assert job.status == "done"
        assert job.video_id == 42
        assert job.finished_at is not None

    def test_mark_failed_stores_error(self, session: Session) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        job_service.mark_failed(session, job, "boom")

        assert job.status == "failed"
        assert job.error == "boom"
        assert job.finished_at is not None

    def test_delete_removes_job(self, session: Session) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        job_service.delete_job(session, job.id)

        assert session.get(BatchJob, job.id) is None

    def test_clear_finished_removes_done_and_failed(self, session: Session) -> None:
        a = job_service.create_jobs(session, ["https://youtu.be/a"])[0]
        b = job_service.create_jobs(session, ["https://youtu.be/b"])[0]
        job_service.create_jobs(session, ["https://youtu.be/c"])  # stays pending
        job_service.mark_done(session, a, video_id=1)
        job_service.mark_failed(session, b, "x")

        deleted = job_service.clear_finished(session)

        assert deleted == 2
        remaining = session.exec(select(BatchJob)).all()
        assert len(remaining) == 1
        assert remaining[0].status == "pending"

    def test_reset_running_to_pending(self, session: Session) -> None:
        a = job_service.create_jobs(session, ["https://youtu.be/a"])[0]
        b = job_service.create_jobs(session, ["https://youtu.be/b"])[0]
        job_service.mark_running(session, a)
        job_service.mark_done(session, b, video_id=1)

        n = job_service.reset_running_to_pending(session)

        assert n == 1
        session.refresh(a)
        assert a.status == "pending"


class TestJobWorker:
    @pytest.mark.asyncio
    async def test_process_one_marks_done_on_success(self, session: Session) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        with patch.object(
            video_service, "process",
            new=AsyncMock(side_effect=lambda s, u: _fake_response(u, video_id=99)),
        ):
            processed = await job_worker.process_one(session)

        assert processed is True
        session.refresh(job)
        assert job.status == "done"
        assert job.video_id == 99

    @pytest.mark.asyncio
    async def test_process_one_marks_failed_on_exception(self, session: Session) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        with patch.object(
            video_service, "process", new=AsyncMock(side_effect=RuntimeError("boom")),
        ):
            processed = await job_worker.process_one(session)

        assert processed is True
        session.refresh(job)
        assert job.status == "failed"
        assert job.error == "boom"

    @pytest.mark.asyncio
    async def test_process_one_returns_false_when_queue_empty(
        self, session: Session
    ) -> None:
        result = await job_worker.process_one(session)
        assert result is False


class TestJobRouter:
    def test_post_creates_jobs(self, client: TestClient) -> None:
        resp = client.post(
            "/jobs/", json={"youtube_urls": ["https://youtu.be/a", "https://youtu.be/b"]}
        )

        assert resp.status_code == 201
        body = resp.json()
        assert len(body) == 2
        assert all(j["status"] == "pending" for j in body)

    def test_post_rejects_empty_list(self, client: TestClient) -> None:
        resp = client.post("/jobs/", json={"youtube_urls": []})
        assert resp.status_code == 422

    def test_get_returns_all(
        self, client: TestClient, session: Session
    ) -> None:
        job_service.create_jobs(session, ["https://youtu.be/a"])

        resp = client.get("/jobs/")

        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_get_with_status_filter(
        self, client: TestClient, session: Session
    ) -> None:
        job_service.create_jobs(session, ["https://youtu.be/a"])

        resp = client.get("/jobs/?status=done")

        assert resp.status_code == 200
        assert resp.json() == []

    def test_delete_removes_job(
        self, client: TestClient, session: Session
    ) -> None:
        job = job_service.create_jobs(session, ["https://youtu.be/a"])[0]

        resp = client.delete(f"/jobs/{job.id}")

        assert resp.status_code == 204

    def test_delete_finished_clears_done_and_failed(
        self, client: TestClient, session: Session
    ) -> None:
        a = job_service.create_jobs(session, ["https://youtu.be/a"])[0]
        job_service.mark_done(session, a, video_id=1)

        resp = client.delete("/jobs/finished")

        assert resp.status_code == 200
        assert resp.json()["deleted"] == 1
