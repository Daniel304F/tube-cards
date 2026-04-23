"""Lightweight schema migrations for SQLite.

SQLModel.metadata.create_all only creates new tables; it does not alter existing
tables when new columns are added to a model. This module inspects existing
tables and adds missing columns via ALTER TABLE on startup.

Keep this file idempotent — it is safe to run on every boot.
"""
import logging
from datetime import datetime
from sqlalchemy import text
from sqlalchemy.engine import Engine

logger = logging.getLogger(__name__)


# (table_name, column_name, column_ddl)
FLASHCARD_COLUMNS: list[tuple[str, str, str]] = [
    ("flashcard", "ease_factor", "REAL NOT NULL DEFAULT 2.5"),
    ("flashcard", "interval", "INTEGER NOT NULL DEFAULT 0"),
    ("flashcard", "repetitions", "INTEGER NOT NULL DEFAULT 0"),
    ("flashcard", "due_date", "TEXT"),
    ("flashcard", "last_reviewed", "TEXT"),
]


def _get_existing_columns(engine: Engine, table: str) -> set[str]:
    with engine.connect() as conn:
        rows = conn.execute(text(f"PRAGMA table_info({table})")).all()
    return {row[1] for row in rows}


def run_migrations(engine: Engine) -> None:
    """Add any missing columns defined in FLASHCARD_COLUMNS."""
    existing = _get_existing_columns(engine, "flashcard")
    if not existing:
        return  # table does not exist yet — create_all will handle it

    now = datetime.utcnow().isoformat()

    with engine.begin() as conn:
        for table, column, ddl in FLASHCARD_COLUMNS:
            if column in existing:
                continue
            conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {ddl}"))
            logger.info("Added column %s.%s", table, column)

            # Backfill due_date so pre-existing cards become reviewable today
            if column == "due_date":
                conn.execute(
                    text(f"UPDATE {table} SET due_date = :now WHERE due_date IS NULL"),
                    {"now": now},
                )
