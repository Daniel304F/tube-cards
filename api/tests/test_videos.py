"""Tests for video read endpoints (process is skipped — requires LLM + network)."""
from fastapi.testclient import TestClient
from sqlmodel import Session

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
