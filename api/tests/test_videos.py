"""Tests for video read endpoints (process is skipped — requires LLM + network)."""
from unittest.mock import AsyncMock, patch

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session, select

from models.flashcard import Flashcard
from models.summary import Summary
from models.video import Video
from services import video as video_service


class TestVideoService:
    def test_get_all_returns_videos(self, session: Session, make_video) -> None:
        make_video(title="One")
        make_video(title="Two")

        result = video_service.get_all(session)

        assert len(result) == 2

    def test_get_by_id(self, session: Session, make_video) -> None:
        v = make_video(title="Target")

        result = video_service.get_by_id(session, v.id)

        assert result.id == v.id
        assert result.title == "Target"


class TestVideoFlashcardJsonParser:
    """`_parse_flashcard_json` accepts the messy shapes LLMs produce."""

    def test_parses_plain_json(self) -> None:
        raw = '[{"question": "Q?", "answer": "A."}]'

        result = video_service._parse_flashcard_json(raw)

        assert result == [{"question": "Q?", "answer": "A."}]

    def test_strips_markdown_fences(self) -> None:
        raw = '```json\n[{"question": "Q?", "answer": "A."}]\n```'

        result = video_service._parse_flashcard_json(raw)

        assert len(result) == 1

    def test_invalid_json_raises(self) -> None:
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            video_service._parse_flashcard_json("not json")

        assert exc_info.value.status_code == 502

    def test_non_list_raises(self) -> None:
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            video_service._parse_flashcard_json('{"question": "Q?", "answer": "A."}')

        assert exc_info.value.status_code == 502

    def test_items_missing_keys_are_skipped(self) -> None:
        raw = '[{"question": "Q1", "answer": "A1"}, {"foo": "bar"}]'

        result = video_service._parse_flashcard_json(raw)

        assert len(result) == 1

    def test_all_items_invalid_raises(self) -> None:
        from fastapi import HTTPException
        import pytest

        with pytest.raises(HTTPException) as exc_info:
            video_service._parse_flashcard_json('[{"foo": "bar"}]')

        assert exc_info.value.status_code == 502


class TestVideoRouter:
    def test_list_endpoint(self, client: TestClient, make_video) -> None:
        make_video()

        response = client.get("/videos/")

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_get_by_id_missing_returns_404(self, client: TestClient) -> None:
        response = client.get("/videos/999")

        assert response.status_code == 404


def _llm_responses() -> AsyncMock:
    """Return an AsyncMock that yields (flashcards-JSON, summary-text) on successive calls."""
    return AsyncMock(
        side_effect=[
            '[{"question": "NEW Q", "answer": "NEW A"}]',
            "NEW SUMMARY",
        ]
    )


class TestRegenerateService:
    @pytest.mark.asyncio
    async def test_replaces_flashcards_and_summary(
        self, session: Session, make_video, make_flashcard, make_summary
    ) -> None:
        v = make_video(transcript="some transcript")
        make_flashcard(v.id, question="OLD Q")
        make_summary(v.id, content="OLD SUM")

        with patch("services.llm.complete", new=_llm_responses()):
            result = await video_service.regenerate(session, v.id)

        # Old content is gone (compared by content — SQLite reuses deleted PKs)
        remaining_questions = [
            fc.question
            for fc in session.exec(select(Flashcard).where(Flashcard.video_id == v.id)).all()
        ]
        remaining_summaries = [
            s.content
            for s in session.exec(select(Summary).where(Summary.video_id == v.id)).all()
        ]
        assert "OLD Q" not in remaining_questions
        assert "OLD SUM" not in remaining_summaries

        # New rows reflect mocked LLM output
        assert any(fc.question == "NEW Q" for fc in result.flashcards)
        assert result.summary.content == "NEW SUMMARY"

    @pytest.mark.asyncio
    async def test_keeps_video_row_and_url(
        self, session: Session, make_video
    ) -> None:
        v = make_video(transcript="t")
        original_url = v.youtube_url

        with patch("services.llm.complete", new=_llm_responses()):
            await video_service.regenerate(session, v.id)

        v_after = session.get(Video, v.id)
        assert v_after is not None
        assert v_after.id == v.id
        assert v_after.youtube_url == original_url

    @pytest.mark.asyncio
    async def test_updates_processed_at(
        self, session: Session, make_video
    ) -> None:
        from datetime import datetime, timedelta

        v = make_video(transcript="t")
        v.processed_at = datetime.utcnow() - timedelta(days=1)
        session.add(v)
        session.commit()
        old_processed = v.processed_at

        with patch("services.llm.complete", new=_llm_responses()):
            await video_service.regenerate(session, v.id)

        v_after = session.get(Video, v.id)
        assert v_after.processed_at is not None
        assert v_after.processed_at > old_processed

    @pytest.mark.asyncio
    async def test_404_for_unknown_video(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            await video_service.regenerate(session, 9999)

        assert exc.value.status_code == 404


class TestRegenerateRouter:
    def test_endpoint_returns_process_response(
        self, client: TestClient, make_video, make_flashcard, make_summary
    ) -> None:
        v = make_video(transcript="t")
        make_flashcard(v.id, question="OLD")
        make_summary(v.id, content="OLD")

        with patch("services.llm.complete", new=_llm_responses()):
            resp = client.post(f"/videos/{v.id}/regenerate")

        assert resp.status_code == 200
        body = resp.json()
        assert body["video"]["id"] == v.id
        assert any(fc["question"] == "NEW Q" for fc in body["flashcards"])
        assert body["summary"]["content"] == "NEW SUMMARY"

    def test_endpoint_404_for_unknown_video(self, client: TestClient) -> None:
        resp = client.post("/videos/9999/regenerate")
        assert resp.status_code == 404
