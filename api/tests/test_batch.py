"""Tests for batch video processing."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from services import video as video_service
from schemas.summary import SummaryRead
from schemas.video import VideoProcessResponse, VideoRead


def _fake_response(url: str) -> VideoProcessResponse:
    from datetime import datetime

    now = datetime.utcnow()
    return VideoProcessResponse(
        video=VideoRead(
            id=1,
            youtube_url=url,
            title="T",
            transcript="x",
            processed_at=now,
            created_at=now,
        ),
        flashcards=[],
        summary=SummaryRead(
            id=1, content="s", video_id=1, folder_id=None, created_at=now, updated_at=now
        ),
    )


class TestProcessBatchService:
    @pytest.mark.asyncio
    async def test_returns_one_result_per_url(self, session: Session) -> None:
        urls = ["https://youtu.be/a", "https://youtu.be/b"]

        with patch.object(
            video_service, "process", new=AsyncMock(side_effect=lambda s, u: _fake_response(u))
        ):
            results = await video_service.process_batch(session, urls)

        assert len(results) == 2
        assert all(r.success for r in results)
        assert [r.youtube_url for r in results] == urls

    @pytest.mark.asyncio
    async def test_failure_does_not_stop_batch(self, session: Session) -> None:
        urls = ["https://youtu.be/ok", "https://youtu.be/bad", "https://youtu.be/ok2"]

        async def side(_s, url):
            if "bad" in url:
                raise RuntimeError("boom")
            return _fake_response(url)

        with patch.object(video_service, "process", new=AsyncMock(side_effect=side)):
            results = await video_service.process_batch(session, urls)

        assert [r.success for r in results] == [True, False, True]
        assert results[1].error is not None

    @pytest.mark.asyncio
    async def test_empty_list_returns_empty(self, session: Session) -> None:
        results = await video_service.process_batch(session, [])
        assert results == []


class TestProcessBatchRouter:
    def test_endpoint_returns_results(self, client: TestClient) -> None:
        with patch.object(
            video_service, "process", new=AsyncMock(side_effect=lambda s, u: _fake_response(u))
        ):
            resp = client.post(
                "/videos/process-batch",
                json={"youtube_urls": ["https://youtu.be/a", "https://youtu.be/b"]},
            )

        assert resp.status_code == 201
        body = resp.json()
        assert len(body["results"]) == 2
        assert body["success_count"] == 2
        assert body["error_count"] == 0

    def test_endpoint_rejects_empty_list(self, client: TestClient) -> None:
        resp = client.post("/videos/process-batch", json={"youtube_urls": []})
        assert resp.status_code == 422
