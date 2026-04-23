"""Shared test fixtures.

Each test gets a fresh in-memory SQLite database and a FastAPI TestClient
with the `get_session` dependency overridden to use that database.
"""
import sys
from datetime import datetime
from pathlib import Path
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.pool import StaticPool
from sqlmodel import Session, SQLModel, create_engine

API_ROOT = Path(__file__).resolve().parent.parent
if str(API_ROOT) not in sys.path:
    sys.path.insert(0, str(API_ROOT))

import models  # noqa: F401,E402 — register tables
from database import get_session  # noqa: E402
from main import app  # noqa: E402
from migrations import run_migrations  # noqa: E402
from models.flashcard import Flashcard  # noqa: E402
from models.folder import Folder  # noqa: E402
from models.summary import Summary  # noqa: E402
from models.video import Video  # noqa: E402


@pytest.fixture(name="engine")
def engine_fixture():
    """Fresh in-memory SQLite engine per test."""
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    run_migrations(engine)
    yield engine
    engine.dispose()


@pytest.fixture(name="session")
def session_fixture(engine) -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client")
def client_fixture(session: Session) -> Generator[TestClient, None, None]:
    def override_get_session() -> Generator[Session, None, None]:
        yield session

    app.dependency_overrides[get_session] = override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def make_video(session: Session):
    """Factory that persists a Video and returns it."""
    counter = {"n": 0}

    def _make(title: str = "Test Video", transcript: str = "Hello world.") -> Video:
        counter["n"] += 1
        v = Video(
            youtube_url=f"https://youtu.be/test{counter['n']}",
            title=title,
            transcript=transcript,
            processed_at=datetime.utcnow(),
        )
        session.add(v)
        session.commit()
        session.refresh(v)
        return v

    return _make


@pytest.fixture
def make_folder(session: Session):
    def _make(name: str = "Test Folder", parent_id: int | None = None) -> Folder:
        f = Folder(name=name, parent_id=parent_id)
        session.add(f)
        session.commit()
        session.refresh(f)
        return f

    return _make


@pytest.fixture
def make_flashcard(session: Session):
    def _make(
        video_id: int,
        question: str = "What is X?",
        answer: str = "X is a thing.",
        folder_id: int | None = None,
    ) -> Flashcard:
        fc = Flashcard(
            question=question,
            answer=answer,
            video_id=video_id,
            folder_id=folder_id,
        )
        session.add(fc)
        session.commit()
        session.refresh(fc)
        return fc

    return _make


@pytest.fixture
def make_summary(session: Session):
    def _make(
        video_id: int,
        content: str = "A short summary.",
        folder_id: int | None = None,
    ) -> Summary:
        s = Summary(content=content, video_id=video_id, folder_id=folder_id)
        session.add(s)
        session.commit()
        session.refresh(s)
        return s

    return _make
