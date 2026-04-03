from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import SQLModel

from database import engine
from routers import videos, flashcards, summaries, folders, config


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
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
