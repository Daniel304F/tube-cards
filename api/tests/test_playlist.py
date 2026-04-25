"""Tests for playlist extraction + /videos/process-playlist endpoint."""
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from services import playlist as playlist_service
from services import video as video_service
from schemas.summary import SummaryRead
from schemas.video import VideoProcessResponse, VideoRead


def _completed(stdout: str) -> MagicMock:
    proc = MagicMock()
    proc.stdout = stdout
    proc.returncode = 0
    return proc


def _fake_response(url: str) -> VideoProcessResponse:
    from datetime import datetime

    now = datetime.utcnow()
    return VideoProcessResponse(
        video=VideoRead(
            id=1, youtube_url=url, title="T", transcript="x",
            processed_at=now, created_at=now,
        ),
        flashcards=[],
        summary=SummaryRead(
            id=1, content="s", video_id=1, folder_id=None, created_at=now, updated_at=now
        ),
    )


class TestExtractVideoUrls:
    def test_parses_video_ids_from_yt_dlp_output(self) -> None:
        with patch("subprocess.run", return_value=_completed("abc12345678\nxyz98765432\n")):
            urls = playlist_service.extract_video_urls("https://youtube.com/playlist?list=PLx")

        assert urls == [
            "https://www.youtube.com/watch?v=abc12345678",
            "https://www.youtube.com/watch?v=xyz98765432",
        ]

    def test_skips_blank_lines(self) -> None:
        with patch("subprocess.run", return_value=_completed("abc12345678\n\n\nxyz98765432\n")):
            urls = playlist_service.extract_video_urls("https://youtube.com/playlist?list=PLx")

        assert len(urls) == 2

    def test_empty_output_raises_422(self) -> None:
        from fastapi import HTTPException

        with patch("subprocess.run", return_value=_completed("")):
            with pytest.raises(HTTPException) as exc:
                playlist_service.extract_video_urls("https://youtube.com/playlist?list=PLx")

        assert exc.value.status_code == 422

    def test_subprocess_failure_raises_502(self) -> None:
        from fastapi import HTTPException

        with patch("subprocess.run", side_effect=RuntimeError("yt-dlp not found")):
            with pytest.raises(HTTPException) as exc:
                playlist_service.extract_video_urls("https://youtube.com/playlist?list=PLx")

        assert exc.value.status_code == 502


class TestProcessPlaylistService:
    @pytest.mark.asyncio
    async def test_extracts_then_batches(self, session: Session) -> None:
        urls = [
            "https://www.youtube.com/watch?v=aaa12345678",
            "https://www.youtube.com/watch?v=bbb12345678",
        ]
        with patch.object(playlist_service, "extract_video_urls", return_value=urls), \
             patch.object(video_service, "process", new=AsyncMock(side_effect=lambda s, u: _fake_response(u))):
            results = await video_service.process_playlist(
                session, "https://youtube.com/playlist?list=PLx"
            )

        assert len(results) == 2
        assert all(r.success for r in results)


class TestProcessPlaylistRouter:
    def test_endpoint_returns_batch_response(self, client: TestClient) -> None:
        urls = ["https://www.youtube.com/watch?v=aaa12345678"]

        with patch.object(playlist_service, "extract_video_urls", return_value=urls), \
             patch.object(video_service, "process", new=AsyncMock(side_effect=lambda s, u: _fake_response(u))):
            resp = client.post(
                "/videos/process-playlist",
                json={"playlist_url": "https://youtube.com/playlist?list=PLx"},
            )

        assert resp.status_code == 201
        body = resp.json()
        assert body["success_count"] == 1
        assert body["error_count"] == 0
        assert len(body["results"]) == 1

    def test_endpoint_rejects_empty_url(self, client: TestClient) -> None:
        resp = client.post("/videos/process-playlist", json={"playlist_url": ""})
        assert resp.status_code == 422
