from typing import TypeVar, Generator

from fastapi import HTTPException
from sqlmodel import SQLModel, Session, create_engine

from core.config import settings

T = TypeVar("T", bound=SQLModel)

engine = create_engine(settings.database_url)


def get_session() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


def get_or_404(session: Session, model: type[T], id: int) -> T:
    """Fetch by primary key or raise 404."""
    obj = session.get(model, id)
    if not obj:
        raise HTTPException(status_code=404, detail=f"{model.__name__} not found")
    return obj
