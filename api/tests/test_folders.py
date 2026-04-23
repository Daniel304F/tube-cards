"""Tests for folder CRUD — service + router."""
from fastapi.testclient import TestClient
from sqlmodel import Session

from models.folder import Folder
from schemas.folder import FolderCreate, FolderUpdate
from services import folder as folder_service


class TestFolderService:
    def test_create_persists_folder(self, session: Session) -> None:
        result = folder_service.create(session, FolderCreate(name="Work"))

        assert result.id is not None
        assert result.name == "Work"
        assert result.parent_id is None

    def test_create_with_parent(self, session: Session, make_folder) -> None:
        parent = make_folder(name="Parent")

        child = folder_service.create(
            session, FolderCreate(name="Child", parent_id=parent.id)
        )

        assert child.parent_id == parent.id

    def test_get_all_returns_all_folders(self, session: Session, make_folder) -> None:
        make_folder(name="A")
        make_folder(name="B")

        result = folder_service.get_all(session)

        assert len(result) == 2
        assert {f.name for f in result} == {"A", "B"}

    def test_get_all_filters_by_parent_id(self, session: Session, make_folder) -> None:
        parent = make_folder(name="Parent")
        make_folder(name="Child1", parent_id=parent.id)
        make_folder(name="Child2", parent_id=parent.id)
        make_folder(name="Sibling")

        result = folder_service.get_all(session, parent_id=parent.id)

        assert len(result) == 2
        assert all(f.parent_id == parent.id for f in result)

    def test_get_by_id_returns_folder(self, session: Session, make_folder) -> None:
        folder = make_folder(name="Target")

        result = folder_service.get_by_id(session, folder.id)

        assert result.id == folder.id
        assert result.name == "Target"

    def test_update_changes_name(self, session: Session, make_folder) -> None:
        folder = make_folder(name="Old")

        result = folder_service.update(
            session, folder.id, FolderUpdate(name="New")
        )

        assert result.name == "New"

    def test_update_exclude_unset_preserves_other_fields(
        self, session: Session, make_folder
    ) -> None:
        parent = make_folder(name="Parent")
        child = make_folder(name="Child", parent_id=parent.id)

        # Updating only name must preserve parent_id
        folder_service.update(session, child.id, FolderUpdate(name="Renamed"))

        reloaded = session.get(Folder, child.id)
        assert reloaded is not None
        assert reloaded.parent_id == parent.id

    def test_delete_removes_folder(self, session: Session, make_folder) -> None:
        folder = make_folder()

        folder_service.delete(session, folder.id)

        assert session.get(Folder, folder.id) is None


class TestFolderRouter:
    def test_post_creates_folder(self, client: TestClient) -> None:
        response = client.post("/folders/", json={"name": "New"})

        assert response.status_code == 201
        assert response.json()["name"] == "New"

    def test_get_list_returns_all(self, client: TestClient) -> None:
        client.post("/folders/", json={"name": "A"})
        client.post("/folders/", json={"name": "B"})

        response = client.get("/folders/")

        assert response.status_code == 200
        assert len(response.json()) == 2

    def test_get_single_returns_folder(self, client: TestClient) -> None:
        created = client.post("/folders/", json={"name": "X"}).json()

        response = client.get(f"/folders/{created['id']}")

        assert response.status_code == 200
        assert response.json()["name"] == "X"

    def test_get_missing_returns_404(self, client: TestClient) -> None:
        response = client.get("/folders/999")

        assert response.status_code == 404

    def test_patch_updates_folder(self, client: TestClient) -> None:
        created = client.post("/folders/", json={"name": "Old"}).json()

        response = client.patch(f"/folders/{created['id']}", json={"name": "New"})

        assert response.status_code == 200
        assert response.json()["name"] == "New"

    def test_delete_returns_204(self, client: TestClient) -> None:
        created = client.post("/folders/", json={"name": "Gone"}).json()

        response = client.delete(f"/folders/{created['id']}")

        assert response.status_code == 204
        assert client.get(f"/folders/{created['id']}").status_code == 404

    def test_delete_missing_returns_404(self, client: TestClient) -> None:
        response = client.delete("/folders/999")

        assert response.status_code == 404
