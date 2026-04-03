# Skill: Add Database Model

Use this skill when adding a new table to the database.

## Order of Operations

1. Create `api/models/<n>.py`
2. Create `api/schemas/<n>.py` (Create + Read + Update)
3. Import model in `api/database.py` so `create_all` registers it
4. Create `api/services/<n>.py`
5. Verify `get_or_404` is used for all single-item fetches
6. Check that `updated_at` is refreshed on updates

## Step 1 — Model

```python
# api/models/<n>.py
from datetime import datetime
from sqlmodel import SQLModel, Field


class <n>(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)

    # Required fields
    name: str

    # Optional FK example
    folder_id: int | None = Field(default=None, foreign_key="folder.id")

    # Timestamps — always include both
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### Field conventions

| Field type      | Pattern                                                                 |
| --------------- | ----------------------------------------------------------------------- |
| Primary key     | `id: int \| None = Field(default=None, primary_key=True)`               |
| Required string | `name: str`                                                             |
| Optional string | `description: str \| None = None`                                       |
| Foreign key     | `video_id: int = Field(foreign_key="video.id")`                         |
| Optional FK     | `folder_id: int \| None = Field(default=None, foreign_key="folder.id")` |
| Timestamps      | Always `created_at` + `updated_at`                                      |

## Step 2 — Schemas

Always create all three in one file:

```python
# api/schemas/<n>.py
from datetime import datetime
from sqlmodel import SQLModel


class <n>Create(SQLModel):
    """Fields required to create a <n>."""
    name: str
    folder_id: int | None = None


class <n>Read(SQLModel):
    """Fields returned to the client."""
    id: int
    name: str
    folder_id: int | None
    created_at: datetime
    updated_at: datetime


class <n>Update(SQLModel):
    """All fields optional — used for PATCH."""
    name: str | None = None
    folder_id: int | None = None
```

## Step 3 — Register in database.py

Add the import so SQLModel picks it up during `create_all`:

```python
# api/database.py — add to existing imports
from models.<n> import <n>  # noqa: F401 — needed for create_all
```

## Step 4 — Service

```python
# api/services/<n>.py
import logging
from sqlmodel import Session, select
from models.<n> import <n>
from schemas.<n> import <n>Create, <n>Update
from database import get_or_404

logger = logging.getLogger(__name__)


def get_all(session: Session) -> list[<n>]:
    return list(session.exec(select(<n>)).all())


def get_by_id(session: Session, id: int) -> <n>:
    return get_or_404(session, <n>, id)


def create(session: Session, data: <n>Create) -> <n>:
    obj = <n>.model_validate(data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    logger.info("Created <n> id=%d", obj.id)
    return obj


def update(session: Session, id: int, data: <n>Update) -> <n>:
    obj = get_or_404(session, <n>, id)
    updates = data.model_dump(exclude_unset=True)
    # Refresh updated_at on every update
    updates['updated_at'] = datetime.utcnow()
    obj.sqlmodel_update(updates)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj


def delete(session: Session, id: int) -> None:
    obj = get_or_404(session, <n>, id)
    session.delete(obj)
    session.commit()
    logger.info("Deleted <n> id=%d", id)
```

## Checklist Before Finishing

- [ ] Model has both `created_at` and `updated_at`
- [ ] All three schemas created (Create / Read / Update)
- [ ] Update schema has all fields optional
- [ ] Model imported in `database.py`
- [ ] Service uses `get_or_404` — no manual 404 logic
- [ ] `updated_at` refreshed in update service function
- [ ] No raw SQLAlchemy — SQLModel only
- [ ] No `Optional[T]` — use `T | None` syntax
