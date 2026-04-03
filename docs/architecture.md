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

1. User enters a YouTube URL in the browser
2. Client sends `POST /videos/process` with the URL
3. Router delegates to `VideoService`
4. `VideoService` fetches transcript via `youtube-transcript-api`
5. `VideoService` calls `LLMService` with the transcript
6. `LLMService` sends prompt to configured provider via LiteLLM
7. Response is parsed into `Flashcard` and `Summary` objects
8. Objects are persisted to SQLite via SQLModel
9. API returns the created objects
10. Client renders flashcards and summaries

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

## Data Flow: Notion/Remnote Export

The internal data model is the source of truth.
Notion and Remnote are export targets only — never the primary store.

```
SQLite (source of truth)
    └─→ notion.py    → Notion API
    └─→ remnote.py   → Remnote API
```

## Recommendation Engine Options

User selects one of three strategies in the config:

| Strategy      | Implementation                    |
| ------------- | --------------------------------- |
| LLM Search    | Semantic query via configured LLM |
| Vector Search | SQLite-vec, local embeddings      |
| YouTube       | YouTube Data API recommendations  |

## Self-Hosting

- No authentication required — single user assumed
- Database persists in `api/data/app.db`
- All config via environment variables (`.env`)
- Designed to run on Raspberry Pi (low resource footprint)
- `docker-compose.yml` orchestrates both services
