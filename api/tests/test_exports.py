"""Tests for /export router + notion/remnote/anki/markdown services."""
import zipfile
from io import BytesIO
from unittest.mock import MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from sqlmodel import Session

from core.config import settings
from services import anki as anki_service
from services import markdown as markdown_service
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


class TestAnkiService:
    def test_returns_apkg_zip_bytes(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc = make_flashcard(v.id, question="Q1", answer="A1")

        data = anki_service.export_flashcards(session, [fc.id])

        # .apkg files are zip archives — must start with the PK magic header.
        assert data[:2] == b"PK"
        assert len(data) > 100

    def test_zip_contains_anki_collection_db(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc1 = make_flashcard(v.id, question="Q1", answer="A1")
        fc2 = make_flashcard(v.id, question="Q2", answer="A2")

        data = anki_service.export_flashcards(session, [fc1.id, fc2.id])

        with zipfile.ZipFile(BytesIO(data)) as z:
            names = z.namelist()
        assert any(n.startswith("collection.anki") for n in names), (
            f"expected an Anki collection DB in the package; got {names!r}"
        )

    def test_404_for_unknown_flashcard(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            anki_service.export_flashcards(session, [9999])

        assert exc.value.status_code == 404

    def test_empty_list_raises_422(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            anki_service.export_flashcards(session, [])

        assert exc.value.status_code == 422


class TestAnkiRouter:
    def test_endpoint_returns_apkg_download(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc = make_flashcard(v.id)

        response = client.post(
            "/export/anki", json={"flashcard_ids": [fc.id], "summary_ids": []}
        )

        assert response.status_code == 200
        assert response.content[:2] == b"PK"
        # Sane content-type and a downloadable filename
        ctype = response.headers.get("content-type", "")
        assert "octet-stream" in ctype or "anki" in ctype.lower()
        disposition = response.headers.get("content-disposition", "")
        assert "attachment" in disposition.lower()
        assert ".apkg" in disposition.lower()

    def test_endpoint_silently_skips_summary_ids(
        self, client: TestClient, make_video, make_flashcard, make_summary
    ) -> None:
        v = make_video()
        fc = make_flashcard(v.id)
        s = make_summary(v.id)

        response = client.post(
            "/export/anki",
            json={"flashcard_ids": [fc.id], "summary_ids": [s.id]},
        )

        assert response.status_code == 200
        assert response.content[:2] == b"PK"

    def test_endpoint_422_for_empty_flashcards(self, client: TestClient) -> None:
        response = client.post(
            "/export/anki", json={"flashcard_ids": [], "summary_ids": []}
        )

        assert response.status_code == 422


class TestMarkdownService:
    def test_returns_bytes_starting_with_video_header(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video(title="Intro to Rust")
        fc = make_flashcard(v.id, question="What is ownership?", answer="A core concept.")

        data = markdown_service.export(session, [fc.id], [])

        assert isinstance(data, bytes)
        text = data.decode("utf-8")
        assert text.startswith("# Intro to Rust")

    def test_includes_flashcard_question_and_answer(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        fc = make_flashcard(v.id, question="Q-UNIQUE-123", answer="A-UNIQUE-456")

        text = markdown_service.export(session, [fc.id], []).decode("utf-8")

        assert "Q-UNIQUE-123" in text
        assert "A-UNIQUE-456" in text

    def test_includes_summary_content(
        self, session: Session, make_video, make_summary
    ) -> None:
        v = make_video()
        s = make_summary(v.id, content="SUMMARY-MARKER-789")

        text = markdown_service.export(session, [], [s.id]).decode("utf-8")

        assert "SUMMARY-MARKER-789" in text

    def test_groups_flashcards_under_their_video(
        self,
        session: Session,
        make_video,
        make_flashcard,
    ) -> None:
        """Cards from two different videos render under each video's H1, not interleaved."""
        v1 = make_video(title="Video One")
        v2 = make_video(title="Video Two")
        fc_a = make_flashcard(v1.id, question="QA", answer="AA")
        fc_b = make_flashcard(v2.id, question="QB", answer="AB")

        text = markdown_service.export(session, [fc_a.id, fc_b.id], []).decode("utf-8")

        idx_v1 = text.index("# Video One")
        idx_qa = text.index("QA")
        idx_v2 = text.index("# Video Two")
        idx_qb = text.index("QB")
        # QA appears between Video One and Video Two; QB appears after Video Two.
        assert idx_v1 < idx_qa < idx_v2 < idx_qb

    def test_404_for_unknown_flashcard(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            markdown_service.export(session, [9999], [])

        assert exc.value.status_code == 404

    def test_404_for_unknown_summary(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            markdown_service.export(session, [], [9999])

        assert exc.value.status_code == 404

    def test_empty_lists_raises_422(self, session: Session) -> None:
        with pytest.raises(HTTPException) as exc:
            markdown_service.export(session, [], [])

        assert exc.value.status_code == 422


class TestMarkdownRouter:
    def test_endpoint_returns_markdown_download(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        v = make_video(title="My Video")
        fc = make_flashcard(v.id, question="Hello?", answer="World.")

        response = client.post(
            "/export/markdown",
            json={"flashcard_ids": [fc.id], "summary_ids": []},
        )

        assert response.status_code == 200
        text = response.content.decode("utf-8")
        assert text.startswith("# My Video")
        assert "Hello?" in text
        assert "World." in text

        ctype = response.headers.get("content-type", "")
        assert "markdown" in ctype.lower() or "octet-stream" in ctype
        disposition = response.headers.get("content-disposition", "")
        assert "attachment" in disposition.lower()
        assert ".md" in disposition.lower()

    def test_endpoint_includes_summaries(
        self, client: TestClient, make_video, make_summary
    ) -> None:
        """Unlike Anki, markdown export DOES include summaries."""
        v = make_video()
        s = make_summary(v.id, content="SUMMARY-IN-MARKDOWN")

        response = client.post(
            "/export/markdown",
            json={"flashcard_ids": [], "summary_ids": [s.id]},
        )

        assert response.status_code == 200
        assert "SUMMARY-IN-MARKDOWN" in response.content.decode("utf-8")

    def test_endpoint_422_for_empty_request(self, client: TestClient) -> None:
        response = client.post(
            "/export/markdown", json={"flashcard_ids": [], "summary_ids": []}
        )

        assert response.status_code == 422
