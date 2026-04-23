"""Tests for the lightweight migration system."""
from sqlalchemy import text
from sqlalchemy.pool import StaticPool
from sqlmodel import SQLModel, create_engine

from migrations import run_migrations


def _get_column_names(engine, table: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).all()
    return {row[1] for row in rows}


class TestMigrations:
    def test_adds_sm2_columns_to_legacy_flashcard_table(self) -> None:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        # Simulate a pre-migration schema (no SM-2 fields)
        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE flashcard (
                    id INTEGER PRIMARY KEY,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    video_id INTEGER NOT NULL,
                    folder_id INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """))

        run_migrations(engine)

        columns = _get_column_names(engine, "flashcard")
        assert "ease_factor" in columns
        assert "interval" in columns
        assert "repetitions" in columns
        assert "due_date" in columns
        assert "last_reviewed" in columns

    def test_is_idempotent(self) -> None:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        # Use the real schema — all new columns already present
        import models  # noqa: F401
        SQLModel.metadata.create_all(engine)

        # Running twice must not raise
        run_migrations(engine)
        run_migrations(engine)

        columns = _get_column_names(engine, "flashcard")
        assert "ease_factor" in columns

    def test_backfills_due_date(self) -> None:
        engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )

        with engine.begin() as conn:
            conn.execute(text("""
                CREATE TABLE flashcard (
                    id INTEGER PRIMARY KEY,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    video_id INTEGER NOT NULL,
                    folder_id INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
            """))
            conn.execute(text("""
                INSERT INTO flashcard (id, question, answer, video_id, created_at, updated_at)
                VALUES (1, 'Q', 'A', 1, '2024-01-01T00:00:00', '2024-01-01T00:00:00')
            """))

        run_migrations(engine)

        with engine.connect() as conn:
            row = conn.execute(text("SELECT due_date FROM flashcard WHERE id = 1")).one()

        assert row[0] is not None  # backfilled
