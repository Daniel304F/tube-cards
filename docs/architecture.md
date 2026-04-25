# Architecture

## Overview

YouTube Flashcard Generator is a self-hosted, single-user web application.
The user runs both frontend and backend locally or on a Raspberry Pi.
No cloud services are required except external APIs (YouTube, LLM providers, Notion, Remnote).

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                        Browser                          │
│                    React 19 (Vite)                      │
│              client/ — port 5173 (dev)                  │
└───────────────────────┬─────────────────────────────────┘
                        │ HTTP (Axios)
                        ▼
┌─────────────────────────────────────────────────────────┐
│                    FastAPI Backend                      │
│              api/ — port 8000                           │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ routers/ │→ │services/ │→ │ models/  │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                     │                │                  │
│                     ▼                ▼                  │
│             ┌──────────────┐  ┌──────────┐             │
│             │  LiteLLM     │  │  SQLite  │             │
│             └──────┬───────┘  └──────────┘             │
└────────────────────┼────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   OpenAI API   Anthropic API  Ollama (local)
```

## Request Flow

### Single video
1. User enters a YouTube URL in the browser
2. Client sends `POST /videos/process` with the URL
3. Router delegates to `video_service.process`
4. Service fetches transcript via `youtube-transcript-api`
5. Service calls `llm.complete` (the only LiteLLM call site)
6. Response is parsed into `Flashcard` and `Summary` objects
7. Objects are persisted to SQLite via SQLModel
8. API returns `VideoProcessResponse` (video + flashcards + summary)
9. Client renders the result

### Batch
- `POST /videos/process-batch` accepts `{ "youtube_urls": [...] }`.
- `video_service.process_batch` calls `process()` per URL **sequentially**.
- A failure on one URL is captured (`success=false`, `error=...`) and the batch continues.
- Response shape: `VideoBatchResponse { results, success_count, error_count }`.

## Layer Responsibilities

### Routers (`api/routers/`)

- Parse and validate incoming requests (via Pydantic schemas)
- Call the appropriate service method
- Return the response with correct HTTP status
- No business logic — no direct DB access

### Services (`api/services/`)

- Contain all business logic
- Orchestrate calls between DB, LLM, and external APIs
- Independently testable (no FastAPI dependencies)
- Each service focuses on one domain

### Models (`api/models/`)

- SQLModel table definitions
- Represent the database schema
- No business logic
- Current tables: `video`, `flashcard`, `summary`, `folder`, `tag`, `flashcard_tag`
  (see `docs/entities.md` for fields and relationships)

### Schemas (`api/schemas/`)

- Pydantic models for API input/output
- Separate from DB models intentionally:
  - `*Create` — fields required to create a resource
  - `*Read` — fields returned to the client
  - `*Update` — fields allowed in a PATCH request

### Services LLM (`api/services/llm.py`)

- Single entry point for all LLM communication
- Abstracts provider differences (OpenAI, Anthropic, Ollama)
- All other services call this — never LiteLLM directly

## Routers & Services (current)

| Router file        | Prefix         | Service              | Domain                                   |
| ------------------ | -------------- | -------------------- | ---------------------------------------- |
| `videos.py`        | `/videos`      | `video.py`           | Process URLs (single + batch), list/get  |
| `flashcards.py`    | `/flashcards`  | `flashcard.py`       | CRUD on flashcards                       |
| `summaries.py`     | `/summaries`   | `summary.py`         | CRUD on summaries                        |
| `folders.py`       | `/folders`     | `folder.py`          | CRUD on folders, hierarchy               |
| `tags.py`          | `/tags`        | `tag.py`             | CRUD on tags, attach/detach to cards     |
| `search.py`        | `/search`      | `search.py`          | Search across cards/summaries            |
| `study.py`         | `/study`       | `study.py`           | SM-2 spaced repetition                   |
| `exports.py`       | `/exports`     | `notion.py`, `remnote.py` | Push internal data to external apps |
| `config.py`        | `/config`      | `config.py`          | Read/write app settings                  |

Plus `services/transcript.py` (YouTube transcript fetching) and `services/llm.py`
(the only file that imports LiteLLM).

## Data Flow: Notion/Remnote Export

The internal data model is the source of truth.
Notion and Remnote are export targets only — never the primary store.

```
SQLite (source of truth)
    └─→ notion.py    → Notion API
    └─→ remnote.py   → Remnote API
```

## Self-Hosting

- No authentication required — single user assumed
- Database persists in `api/data/app.db` (the `data/` folder must be created
  manually on first start — see `CLAUDE.local.md`)
- All config via environment variables (`.env`)
- Designed to run on Raspberry Pi (low resource footprint)
- Dev URLs: frontend `http://localhost:5173`, API `http://localhost:8000`
- No Docker setup is checked in today; both services are started manually
  (`uvicorn` for the API, `vite` for the client)
