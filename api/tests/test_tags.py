"""Tests for the Tags feature — service + router.

TDD: written before the implementation exists. These drive the design of
the tag model, service contract, and HTTP surface.
"""
from fastapi.testclient import TestClient
from sqlmodel import Session

import pytest


class TestTagService:
    def test_create_persists_tag(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate

        result = tag_service.create(session, TagCreate(name="python"))

        assert result.id is not None
        assert result.name == "python"
        assert result.color  # default color assigned
        assert result.created_at is not None

    def test_create_with_explicit_color(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate

        result = tag_service.create(
            session, TagCreate(name="urgent", color="#ef4444")
        )

        assert result.color == "#ef4444"

    def test_create_duplicate_name_raises_409(self, session: Session) -> None:
        from fastapi import HTTPException
        from services import tag as tag_service
        from schemas.tag import TagCreate

        tag_service.create(session, TagCreate(name="dup"))

        with pytest.raises(HTTPException) as exc_info:
            tag_service.create(session, TagCreate(name="dup"))

        assert exc_info.value.status_code == 409

    def test_get_all_returns_all_tags(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate

        tag_service.create(session, TagCreate(name="a"))
        tag_service.create(session, TagCreate(name="b"))

        result = tag_service.get_all(session)

        assert len(result) == 2
        assert {t.name for t in result} == {"a", "b"}

    def test_get_by_id_returns_tag(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate

        created = tag_service.create(session, TagCreate(name="x"))

        result = tag_service.get_by_id(session, created.id)

        assert result.id == created.id
        assert result.name == "x"

    def test_get_by_id_missing_raises_404(self, session: Session) -> None:
        from fastapi import HTTPException
        from services import tag as tag_service

        with pytest.raises(HTTPException) as exc_info:
            tag_service.get_by_id(session, 9999)

        assert exc_info.value.status_code == 404

    def test_update_changes_name(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate, TagUpdate

        tag = tag_service.create(session, TagCreate(name="old"))

        result = tag_service.update(session, tag.id, TagUpdate(name="new"))

        assert result.name == "new"

    def test_update_changes_color(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate, TagUpdate

        tag = tag_service.create(session, TagCreate(name="c"))

        result = tag_service.update(
            session, tag.id, TagUpdate(color="#000000")
        )

        assert result.color == "#000000"

    def test_update_to_conflicting_name_raises_409(self, session: Session) -> None:
        from fastapi import HTTPException
        from services import tag as tag_service
        from schemas.tag import TagCreate, TagUpdate

        tag_service.create(session, TagCreate(name="taken"))
        other = tag_service.create(session, TagCreate(name="other"))

        with pytest.raises(HTTPException) as exc_info:
            tag_service.update(session, other.id, TagUpdate(name="taken"))

        assert exc_info.value.status_code == 409

    def test_delete_removes_tag(self, session: Session) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate
        from models.tag import Tag

        tag = tag_service.create(session, TagCreate(name="x"))

        tag_service.delete(session, tag.id)

        assert session.get(Tag, tag.id) is None

    def test_delete_cascades_to_flashcard_links(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        """Deleting a tag must remove all FlashcardTag links referring to it."""
        from services import tag as tag_service
        from schemas.tag import TagCreate
        from models.flashcard_tag import FlashcardTag
        from sqlmodel import select

        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = tag_service.create(session, TagCreate(name="x"))
        tag_service.attach(session, fc.id, tag.id)

        tag_service.delete(session, tag.id)

        remaining = session.exec(select(FlashcardTag)).all()
        assert len(remaining) == 0


class TestTagAttachDetach:
    def test_attach_creates_link(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate
        from models.flashcard_tag import FlashcardTag
        from sqlmodel import select

        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = tag_service.create(session, TagCreate(name="a"))

        tag_service.attach(session, fc.id, tag.id)

        links = session.exec(select(FlashcardTag)).all()
        assert len(links) == 1

    def test_attach_idempotent(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate
        from models.flashcard_tag import FlashcardTag
        from sqlmodel import select

        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = tag_service.create(session, TagCreate(name="a"))

        tag_service.attach(session, fc.id, tag.id)
        tag_service.attach(session, fc.id, tag.id)  # should not duplicate

        links = session.exec(select(FlashcardTag)).all()
        assert len(links) == 1

    def test_attach_missing_flashcard_raises_404(
        self, session: Session
    ) -> None:
        from fastapi import HTTPException
        from services import tag as tag_service
        from schemas.tag import TagCreate

        tag = tag_service.create(session, TagCreate(name="a"))

        with pytest.raises(HTTPException) as exc_info:
            tag_service.attach(session, 9999, tag.id)

        assert exc_info.value.status_code == 404

    def test_attach_missing_tag_raises_404(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        from fastapi import HTTPException
        from services import tag as tag_service

        video = make_video()
        fc = make_flashcard(video_id=video.id)

        with pytest.raises(HTTPException) as exc_info:
            tag_service.attach(session, fc.id, 9999)

        assert exc_info.value.status_code == 404

    def test_detach_removes_link(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate
        from models.flashcard_tag import FlashcardTag
        from sqlmodel import select

        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = tag_service.create(session, TagCreate(name="a"))
        tag_service.attach(session, fc.id, tag.id)

        tag_service.detach(session, fc.id, tag.id)

        links = session.exec(select(FlashcardTag)).all()
        assert len(links) == 0

    def test_detach_nonexistent_link_is_noop(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate

        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = tag_service.create(session, TagCreate(name="a"))

        # Must not raise even though the link was never created
        tag_service.detach(session, fc.id, tag.id)

    def test_get_tags_for_flashcard(
        self, session: Session, make_video, make_flashcard
    ) -> None:
        from services import tag as tag_service
        from schemas.tag import TagCreate

        video = make_video()
        fc = make_flashcard(video_id=video.id)
        t1 = tag_service.create(session, TagCreate(name="a"))
        t2 = tag_service.create(session, TagCreate(name="b"))
        tag_service.attach(session, fc.id, t1.id)
        tag_service.attach(session, fc.id, t2.id)

        result = tag_service.get_tags_for_flashcard(session, fc.id)

        assert {t.name for t in result} == {"a", "b"}


class TestTagRouter:
    def test_post_creates_tag(self, client: TestClient) -> None:
        response = client.post("/tags/", json={"name": "python"})

        assert response.status_code == 201
        body = response.json()
        assert body["name"] == "python"
        assert body["color"]
        assert body["id"]

    def test_post_with_color(self, client: TestClient) -> None:
        response = client.post(
            "/tags/", json={"name": "red", "color": "#ff0000"}
        )

        assert response.status_code == 201
        assert response.json()["color"] == "#ff0000"

    def test_post_duplicate_returns_409(self, client: TestClient) -> None:
        client.post("/tags/", json={"name": "dup"})

        response = client.post("/tags/", json={"name": "dup"})

        assert response.status_code == 409

    def test_get_list(self, client: TestClient) -> None:
        client.post("/tags/", json={"name": "a"})
        client.post("/tags/", json={"name": "b"})

        response = client.get("/tags/")

        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_patch_updates_tag(self, client: TestClient) -> None:
        created = client.post("/tags/", json={"name": "old"}).json()

        response = client.patch(f"/tags/{created['id']}", json={"name": "new"})

        assert response.status_code == 200
        assert response.json()["name"] == "new"

    def test_delete_returns_204(self, client: TestClient) -> None:
        created = client.post("/tags/", json={"name": "x"}).json()

        response = client.delete(f"/tags/{created['id']}")

        assert response.status_code == 204

    def test_attach_tag_to_flashcard(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = client.post("/tags/", json={"name": "t"}).json()

        response = client.post(f"/flashcards/{fc.id}/tags/{tag['id']}")

        assert response.status_code == 204

    def test_detach_tag_from_flashcard(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = client.post("/tags/", json={"name": "t"}).json()
        client.post(f"/flashcards/{fc.id}/tags/{tag['id']}")

        response = client.delete(f"/flashcards/{fc.id}/tags/{tag['id']}")

        assert response.status_code == 204

    def test_flashcard_read_includes_tags(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = client.post("/tags/", json={"name": "t1"}).json()
        client.post(f"/flashcards/{fc.id}/tags/{tag['id']}")

        response = client.get(f"/flashcards/{fc.id}")

        body = response.json()
        assert "tags" in body
        assert len(body["tags"]) == 1
        assert body["tags"][0]["name"] == "t1"

    def test_flashcard_list_filter_by_tag(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc1 = make_flashcard(video_id=video.id, question="tagged")
        make_flashcard(video_id=video.id, question="untagged")
        tag = client.post("/tags/", json={"name": "t"}).json()
        client.post(f"/flashcards/{fc1.id}/tags/{tag['id']}")

        response = client.get(f"/flashcards/?tag_id={tag['id']}")

        assert response.status_code == 200
        assert len(response.json()) == 1
        assert response.json()[0]["question"] == "tagged"

    def test_deleting_tag_removes_it_from_flashcard_tags_list(
        self, client: TestClient, make_video, make_flashcard
    ) -> None:
        video = make_video()
        fc = make_flashcard(video_id=video.id)
        tag = client.post("/tags/", json={"name": "t"}).json()
        client.post(f"/flashcards/{fc.id}/tags/{tag['id']}")

        client.delete(f"/tags/{tag['id']}")

        response = client.get(f"/flashcards/{fc.id}")
        assert response.json()["tags"] == []
