"""Tests for full-text search — service + router."""
from fastapi.testclient import TestClient
from sqlmodel import Session

from services import search as search_service


class TestBuildSnippet:
    def test_empty_text_returns_empty_string(self) -> None:
        assert search_service._build_snippet("", "query") == ""

    def test_no_match_returns_leading_slice(self) -> None:
        text = "hello world"

        result = search_service._build_snippet(text, "xyz")

        assert result == "hello world"

    def test_match_produces_ellipsis_when_truncated(self) -> None:
        long = "a" * 300 + " target " + "b" * 300

        result = search_service._build_snippet(long, "target")

        assert "target" in result
        assert result.startswith("…")
        assert result.endswith("…")

    def test_case_insensitive(self) -> None:
        text = "The Quick Brown Fox"

        result = search_service._build_snippet(text, "quick")

        assert "Quick" in result


class TestSearchService:
    def test_short_query_returns_empty(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        make_flashcard(video_id=v.id, question="something")

        result = search_service.search(session, "a")

        assert result.total == 0
        assert result.hits == []

    def test_matches_flashcard_question(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        make_flashcard(video_id=v.id, question="What is React hooks?")

        result = search_service.search(session, "react")

        assert result.total >= 1
        types = {h.type for h in result.hits}
        assert "flashcard" in types

    def test_matches_flashcard_answer(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        make_flashcard(
            video_id=v.id,
            question="Q?",
            answer="The answer mentions Pydantic validation",
        )

        result = search_service.search(session, "pydantic")

        assert any(h.type == "flashcard" for h in result.hits)

    def test_matches_summary_content(
        self, session: Session, make_video, make_summary
    ) -> None:
        v = make_video()
        make_summary(video_id=v.id, content="Kubernetes orchestrates containers.")

        result = search_service.search(session, "kubernetes")

        assert any(h.type == "summary" for h in result.hits)

    def test_matches_video_title(
        self, session: Session, make_video
    ) -> None:
        make_video(title="Rust ownership explained")

        result = search_service.search(session, "rust")

        assert any(h.type == "video" for h in result.hits)

    def test_no_results_for_unknown_term(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video(title="Python")
        make_flashcard(video_id=v.id, question="Python?", answer="A language")

        result = search_service.search(session, "javascript")

        assert result.total == 0

    def test_case_insensitive_match(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        make_flashcard(video_id=v.id, question="GraphQL basics")

        result = search_service.search(session, "graphql")

        assert any(h.type == "flashcard" for h in result.hits)

    def test_limit_caps_results(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video()
        for i in range(10):
            make_flashcard(video_id=v.id, question=f"Docker question {i}")

        result = search_service.search(session, "docker", limit=3)

        assert len(result.hits) <= 3

    def test_hit_contains_video_metadata(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        v = make_video(title="Go Generics")
        make_flashcard(video_id=v.id, question="What about generics?")

        result = search_service.search(session, "generics")

        hit = next(h for h in result.hits if h.type == "flashcard")
        assert hit.video_id == v.id
        assert hit.video_title == "Go Generics"


class TestSearchRouter:
    def test_endpoint_returns_results(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        v = make_video()
        make_flashcard(video_id=v.id, question="TypeScript tips")

        response = client.get("/search/?q=typescript")

        assert response.status_code == 200
        body = response.json()
        assert body["query"] == "typescript"
        assert body["total"] >= 1

    def test_endpoint_missing_query_returns_422(self, client: TestClient) -> None:
        response = client.get("/search/")

        assert response.status_code == 422

    def test_limit_param_respected(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        v = make_video()
        for i in range(5):
            make_flashcard(video_id=v.id, question=f"Vue {i}")

        response = client.get("/search/?q=vue&limit=2")

        assert response.status_code == 200
        assert len(response.json()["hits"]) <= 2

    def test_limit_out_of_range_returns_422(self, client: TestClient) -> None:
        response = client.get("/search/?q=test&limit=1000")

        assert response.status_code == 422
