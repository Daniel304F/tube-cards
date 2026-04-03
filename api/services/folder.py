import logging

from sqlmodel import Session, select

from models.folder import Folder
from schemas.folder import FolderCreate, FolderUpdate
from database import get_or_404

logger = logging.getLogger(__name__)


def get_all(session: Session, parent_id: int | None = None) -> list[Folder]:
    query = select(Folder)
    if parent_id is not None:
        query = query.where(Folder.parent_id == parent_id)
    return list(session.exec(query).all())


def get_by_id(session: Session, folder_id: int) -> Folder:
    return get_or_404(session, Folder, folder_id)


def create(session: Session, data: FolderCreate) -> Folder:
    folder = Folder.model_validate(data)
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


def update(session: Session, folder_id: int, data: FolderUpdate) -> Folder:
    folder = get_or_404(session, Folder, folder_id)
    folder.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(folder)
    session.commit()
    session.refresh(folder)
    return folder


def delete(session: Session, folder_id: int) -> None:
    folder = get_or_404(session, Folder, folder_id)
    session.delete(folder)
    session.commit()
