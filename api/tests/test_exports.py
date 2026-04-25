"""Tests for /export router + notion/remnote services."""
from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from core.config import settings
from services import notion as notion_service
from services import remnote as remnote_service


@pytest.fixture(autouse=True)
def _set_keys(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(settings, "notion_api_key", "test-notion-key")
    monkeypatch.setattr(settings, "notion_database_id", "test-db")
    monkeypatch.setattr(settings, "remnote_api_key", "test-remnote-key")


def _ok_response() -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.raise_for_status = MagicMock(return_value=None)
    return resp


def _error_response() -> MagicMock:
    resp = MagicMock(spec=httpx.Response)
    resp.raise_for_status = MagicMock(side_effect=httpx.HTTPError("boom"))
    return resp


class TestNotionService:
    def test_missing_api_key_raises_400(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from fastapi import HTTPException

        monkeypatch.setattr(settings, "notion_api_key", "")

        with pytest.raises(HTTPException) as exc:
            notion_service.export_to_notion(session, "db", [], [])

        assert exc.value.status_code == 400

    def test_counts_only_successful_exports(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc1 = make_flashcard(v.id)
        fc2 = make_flashcard(v.id, question="Q2", answer="A2")

        with patch.object(httpx, "post", side_effect=[_ok_response(), _error_response()]):
            fc, sm = notion_service.export_to_notion(session, "db", [fc1.id, fc2.id], [])

        assert fc == 1
        assert sm == 0

    def test_missing_flashcard_raises_404(self, session: Session) -> None:
        from fastapi import HTTPException

        with pytest.raises(HTTPException) as exc:
            notion_service.export_to_notion(session, "db", [9999], [])

        assert exc.value.status_code == 404


class TestRemnoteService:
    def test_missing_api_key_raises_400(
        self, session: Session, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        from fastapi import HTTPException

        monkeypatch.setattr(settings, "remnote_api_key", "")

        with pytest.raises(HTTPException) as exc:
            remnote_service.export_to_remnote(session, [], [])

        assert exc.value.status_code == 400

    def test_exports_summaries(
        self, session: Session, make_video, make_summary
    ) -> None:
        v = make_video()
        s = make_summary(v.id)

        with patch.object(httpx, "post", return_value=_ok_response()):
            fc, sm = remnote_service.export_to_remnote(session, [], [s.id])

        assert fc == 0
        assert sm == 1


class TestExportRouter:
    def test_notion_endpoint(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc = make_flashcard(v.id)

        with patch.object(httpx, "post", return_value=_ok_response()):
            response = client.post(
                "/export/notion",
                json={"flashcard_ids": [fc.id], "summary_ids": []},
            )

        assert response.status_code == 200
        assert response.json()["exported_flashcards"] == 1

    def test_remnote_endpoint(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc = make_flashcard(v.id)

        with patch.object(httpx, "post", return_value=_ok_response()):
            response = client.post(
                "/export/remnote",
                json={"flashcard_ids": [fc.id], "summary_ids": []},
            )

        assert response.status_code == 200
        assert response.json()["exported_flashcards"] == 1

    def test_empty_request_returns_zeros(self, client: TestClient) -> None:
        response = client.post(
            "/export/notion", json={"flashcard_ids": [], "summary_ids": []}
        )

        assert response.status_code == 200
        body = response.json()
        assert body["exported_flashcards"] == 0
        assert body["exported_summaries"] == 0
