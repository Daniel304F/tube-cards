"""Tests for summary CRUD."""
from fastapi.testclient import TestClient
from sqlmodel import Session

from models.summary import Summary
from schemas.summary import SummaryCreate, SummaryUpdate
from services import summary as summary_service


class TestSummaryService:
    def test_create(self, session: Session, make_video) -> None:
        video = make_video()

        result = summary_service.create(
            session, SummaryCreate(content="A summary.", video_id=video.id)
        )

        assert result.id is not None
        assert result.content == "A summary."
        assert result.video_id == video.id

    def test_get_all(self, session: Session, make_video, make_summary) -> None:
        video = make_video()
        make_summary(video_id=video.id)
        make_summary(video_id=video.id)

        result = summary_service.get_all(session)

        assert len(result) == 2

    def test_get_all_filters_by_video_id(
        self, session: Session, make_video, make_summary
    ) -> None:
        v1 = make_video()
        v2 = make_video()
        make_summary(video_id=v1.id)
        make_summary(video_id=v2.id)

        result = summary_service.get_all(session, video_id=v1.id)

        assert len(result) == 1
        assert result[0].video_id == v1.id

    def test_update_changes_content(
        self, session: Session, make_video, make_summary
    ) -> None:
        video = make_video()
        s = make_summary(video_id=video.id, content="Old")

        result = summary_service.update(
            session, s.id, SummaryUpdate(content="New")
        )

        assert result.content == "New"

    def test_delete(self, session: Session, make_video, make_summary) -> None:
        video = make_video()
        s = make_summary(video_id=video.id)

        summary_service.delete(session, s.id)

        assert session.get(Summary, s.id) is None


class TestSummaryRouter:
    def test_list(self, client: TestClient, make_video, make_summary) -> None:
        v = make_video()
        make_summary(video_id=v.id)

        response = client.get("/summaries/")

        assert response.status_code == 200
        assert len(response.json()) == 1

    def test_patch(self, client: TestClient, make_video, make_summary) -> None:
        v = make_video()
        s = make_summary(video_id=v.id, content="Old")

        response = client.patch(f"/summaries/{s.id}", json={"content": "New"})

        assert response.status_code == 200
        assert response.json()["content"] == "New"
