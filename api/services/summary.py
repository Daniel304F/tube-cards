import logging

from sqlmodel import Session, select

from models.summary import Summary
from schemas.summary import SummaryCreate, SummaryUpdate
from database import get_or_404

logger = logging.getLogger(__name__)


def get_all(
    session: Session,
    video_id: int | None = None,
    folder_id: int | None = None,
) -> list[Summary]:
    query = select(Summary)
    if video_id is not None:
        query = query.where(Summary.video_id == video_id)
    if folder_id is not None:
        query = query.where(Summary.folder_id == folder_id)
    return list(session.exec(query).all())


def get_by_id(session: Session, summary_id: int) -> Summary:
    return get_or_404(session, Summary, summary_id)


def create(session: Session, data: SummaryCreate) -> Summary:
    summary = Summary.model_validate(data)
    session.add(summary)
    session.commit()
    session.refresh(summary)
    return summary


def update(session: Session, summary_id: int, data: SummaryUpdate) -> Summary:
    summary = get_or_404(session, Summary, summary_id)
    summary.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(summary)
    session.commit()
    session.refresh(summary)
    return summary


def delete(session: Session, summary_id: int) -> None:
    summary = get_or_404(session, Summary, summary_id)
    session.delete(summary)
    session.commit()
