import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel

from database import engine
import models  # noqa: F401 — ensure all tables are registered for create_all
from migrations import run_migrations
from routers import (
    config,
    exports,
    flashcards,
    folders,
    jobs,
    search,
    study,
    summaries,
    tags,
    videos,
)
from services import job as job_service
from services import job_worker


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    SQLModel.metadata.create_all(engine)
    run_migrations(engine)
    with Session(engine) as session:
        job_service.reset_running_to_pending(session)
    worker_task = asyncio.create_task(job_worker.worker_loop())
    try:
        yield
    finally:
        worker_task.cancel()
        try:
            await worker_task
        except asyncio.CancelledError:
            pass


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
app.include_router(exports.router)
app.include_router(study.router)
app.include_router(search.router)
app.include_router(tags.router)
app.include_router(jobs.router)
