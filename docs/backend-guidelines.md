# Backend Guidelines

FastAPI-specific patterns, SQLModel conventions, and service design.

---

## Router Pattern

Routers are thin. They handle HTTP only — no logic, no direct DB access.

```python
# routers/flashcards.py
from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import get_session
from schemas.flashcard import FlashcardCreate, FlashcardRead, FlashcardUpdate
from services import flashcard as flashcard_service

router = APIRouter(prefix="/flashcards", tags=["flashcards"])


@router.get("/", response_model=list[FlashcardRead])
async def list_flashcards(
    folder_id: int | None = None,
    session: Session = Depends(get_session),
) -> list[FlashcardRead]:
    return flashcard_service.get_all(session, folder_id=folder_id)


@router.post("/", response_model=FlashcardRead, status_code=201)
async def create_flashcard(
    data: FlashcardCreate,
    session: Session = Depends(get_session),
) -> FlashcardRead:
    return flashcard_service.create(session, data)


@router.patch("/{flashcard_id}", response_model=FlashcardRead)
async def update_flashcard(
    flashcard_id: int,
    data: FlashcardUpdate,
    session: Session = Depends(get_session),
) -> FlashcardRead:
    return flashcard_service.update(session, flashcard_id, data)


@router.delete("/{flashcard_id}", status_code=204)
async def delete_flashcard(
    flashcard_id: int,
    session: Session = Depends(get_session),
) -> None:
    flashcard_service.delete(session, flashcard_id)
```

---

## Service Pattern

Services contain all business logic. No FastAPI imports — must be testable independently.

```python
# services/flashcard.py
import logging
from sqlmodel import Session, select
from models.flashcard import Flashcard
from schemas.flashcard import FlashcardCreate, FlashcardUpdate
from database import get_or_404

logger = logging.getLogger(__name__)


def get_all(session: Session, folder_id: int | None = None) -> list[Flashcard]:
    query = select(Flashcard)
    if folder_id is not None:
        query = query.where(Flashcard.folder_id == folder_id)
    return list(session.exec(query).all())


def get_by_id(session: Session, flashcard_id: int) -> Flashcard:
    return get_or_404(session, Flashcard, flashcard_id)


def create(session: Session, data: FlashcardCreate) -> Flashcard:
    flashcard = Flashcard.model_validate(data)
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return flashcard


def update(session: Session, flashcard_id: int, data: FlashcardUpdate) -> Flashcard:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    updates = data.model_dump(exclude_unset=True)
    flashcard.sqlmodel_update(updates)
    session.add(flashcard)
    session.commit()
    session.refresh(flashcard)
    return flashcard


def delete(session: Session, flashcard_id: int) -> None:
    flashcard = get_or_404(session, Flashcard, flashcard_id)
    session.delete(flashcard)
    session.commit()
```

---

## Database Helpers

Shared utilities in `database.py`:

```python
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
```

---

## Model & Schema Separation

DB models and API schemas are always separate files.

```python
# models/flashcard.py — database table
from datetime import datetime
from sqlmodel import SQLModel, Field


class Flashcard(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    question: str
    answer: str
    video_id: int = Field(foreign_key="video.id")
    folder_id: int | None = Field(default=None, foreign_key="folder.id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

```python
# schemas/flashcard.py — API shapes
from datetime import datetime
from sqlmodel import SQLModel


class FlashcardCreate(SQLModel):
    question: str
    answer: str
    video_id: int
    folder_id: int | None = None


class FlashcardRead(SQLModel):
    id: int
    question: str
    answer: str
    video_id: int
    folder_id: int | None
    created_at: datetime
    updated_at: datetime


class FlashcardUpdate(SQLModel):
    question: str | None = None
    answer: str | None = None
    folder_id: int | None = None
```

---

## Pydantic v2 Rules

Always use v2 syntax — never v1:

```python
# WRONG (v1)
class Settings(BaseSettings):
    class Config:
        env_file = ".env"

# CORRECT (v2)
class Settings(BaseSettings):
    model_config = {"env_file": ".env"}
```

```python
# WRONG (v1)
obj.dict()
obj.dict(exclude_unset=True)

# CORRECT (v2)
obj.model_dump()
obj.model_dump(exclude_unset=True)
```

---

## LLM Service

All LLM calls go exclusively through `services/llm.py`.

```python
# services/llm.py
import logging
from fastapi import HTTPException
import litellm
from core.config import settings

logger = logging.getLogger(__name__)


async def complete(prompt: str, system: str | None = None) -> str:
    """Send a prompt to the configured LLM and return the text response."""
    messages: list[dict[str, str]] = []
    if system:
        messages.append({"role": "system", "content": system})
    messages.append({"role": "user", "content": prompt})

    try:
        response = await litellm.acompletion(
            model=settings.llm_model,
            messages=messages,
            api_key=settings.llm_api_key,
        )
        return response.choices[0].message.content
    except Exception as e:
        logger.error("LLM completion failed: %s", str(e))
        raise HTTPException(status_code=502, detail="LLM provider unavailable")
```

Other services call `llm.complete(prompt, system=...)` — never LiteLLM directly.

---

## Logging

Use `logging` — never `print()`.

```python
import logging
logger = logging.getLogger(__name__)

logger.debug("Processing transcript, length=%d", len(transcript))
logger.info("Created %d flashcards for video_id=%s", len(flashcards), video_id)
logger.warning("Transcript quality low for video_id=%s", video_id)
logger.error("LLM call failed: %s", str(e))
```

---

## App Entrypoint

```python
# main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel
from database import engine
from routers import videos, flashcards, summaries, folders, config


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    yield


app = FastAPI(title="TubeCards", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(videos.router)
app.include_router(flashcards.router)
app.include_router(summaries.router)
app.include_router(folders.router)
app.include_router(config.router)
```
