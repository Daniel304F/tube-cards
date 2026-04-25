# Domain Entities — Source of Truth

> **For future Claude:** This is the canonical reference for every domain object in TubeCards.
> Read this before designing any feature. Update this file whenever an entity changes
> (new field, new relationship, new entity, semantic change). Keep tables in sync with
> `api/models/`. If reality and this doc disagree, reality wins — fix the doc.

## How to use this file

1. **Before any feature work**: read the entities involved + their relationships.
2. **Before adding a field or table**: think first whether an existing entity already covers it.
   Prefer extending what exists over inventing parallel structures.
3. **After any model change**: update the entity table here AND add a Changelog line at the bottom.
4. **When extending domain objects**: add fields with safe defaults (SQLite migrations live in
   `api/migrations.py` — every new column needs a backfill-safe default).

---

## Entity Overview

| Entity         | Table             | Purpose                                                  |
| -------------- | ----------------- | -------------------------------------------------------- |
| `Video`        | `video`           | A processed YouTube video — source of all generated content |
| `Flashcard`    | `flashcard`       | A single Q/A card, generated from a video's transcript   |
| `Summary`      | `summary`         | Markdown summary of a video                              |
| `Folder`       | `folder`          | Hierarchical grouping for flashcards/summaries           |
| `Tag`          | `tag`             | Free-form label for flashcards (color-coded)             |
| `FlashcardTag` | `flashcard_tag`   | Association table — many-to-many Flashcard ↔ Tag         |

---

## Relationship Diagram

```
Folder ─┐ (parent_id, self-ref, optional)
        │
        ├──< Flashcard >── many-to-many ──< Tag
        │       │
        │       │ (folder_id, optional)
        │       │ (video_id, required)
        │       ▼
        └──< Summary
                │
                ▼
              Video (1) ──< Flashcard (many)
                    \──< Summary    (many — usually 1)
```

Key rules:
- Every `Flashcard` and `Summary` belongs to exactly **one** `Video` (`video_id`, required).
- A `Flashcard` or `Summary` MAY belong to a `Folder` (`folder_id`, optional).
- `Folder` is hierarchical via `parent_id` (self-ref, optional → root folder).
- `Tag` is shared globally; tags attach only to flashcards (not videos/summaries today).
- A `Video` is NOT directly attached to a `Folder` — folder membership lives on the cards/summaries.

---

## Entity: Video

**Table:** `video` · **Model:** `api/models/video.py`

| Field          | Type            | Default          | Notes                                  |
| -------------- | --------------- | ---------------- | -------------------------------------- |
| `id`           | `int` PK        | autoincrement    |                                        |
| `youtube_url`  | `str`           | required         | The full URL the user submitted        |
| `title`        | `str`           | `""`             | Fetched from YouTube metadata          |
| `transcript`   | `str`           | `""`             | Full transcript text (truncated to `MAX_TRANSCRIPT_CHARS = 12_000` before LLM) |
| `processed_at` | `datetime?`     | `None`           | Set when transcript + generation done  |
| `created_at`   | `datetime`      | `utcnow`         |                                        |

**Created by:** `video_service.process(session, url)` — full pipeline.
**Batch:** `video_service.process_batch(session, urls)` — sequential, error-isolating.

---

## Entity: Flashcard

**Table:** `flashcard` · **Model:** `api/models/flashcard.py`

| Field           | Type          | Default       | Notes                                          |
| --------------- | ------------- | ------------- | ---------------------------------------------- |
| `id`            | `int` PK      | autoincrement |                                                |
| `question`      | `str`         | required      |                                                |
| `answer`        | `str`         | required      |                                                |
| `video_id`      | `int` FK      | required      | → `video.id`                                   |
| `folder_id`     | `int?` FK     | `None`        | → `folder.id`                                  |
| `created_at`    | `datetime`    | `utcnow`      |                                                |
| `updated_at`    | `datetime`    | `utcnow`      |                                                |
| **SM-2 spaced repetition**                                                                       |
| `ease_factor`   | `float`       | `2.5`         | SM-2 ease, lowered on bad recall               |
| `interval`      | `int`         | `0`           | Days until next review                         |
| `repetitions`   | `int`         | `0`           | Successful reviews in a row                    |
| `due_date`      | `datetime`    | `utcnow`      | Card is reviewable when `due_date <= now`      |
| `last_reviewed` | `datetime?`   | `None`        |                                                |

**Tags:** via `FlashcardTag` association.
**Service:** `api/services/flashcard.py`, study/SM-2 logic in `api/services/study.py`.

---

## Entity: Summary

**Table:** `summary` · **Model:** `api/models/summary.py`

| Field         | Type        | Default       | Notes                       |
| ------------- | ----------- | ------------- | --------------------------- |
| `id`          | `int` PK    | autoincrement |                             |
| `content`     | `str`       | required      | Markdown                    |
| `video_id`    | `int` FK    | required      | → `video.id`                |
| `folder_id`   | `int?` FK   | `None`        | → `folder.id`               |
| `created_at`  | `datetime`  | `utcnow`      |                             |
| `updated_at`  | `datetime`  | `utcnow`      |                             |

---

## Entity: Folder

**Table:** `folder` · **Model:** `api/models/folder.py`

| Field        | Type        | Default       | Notes                                  |
| ------------ | ----------- | ------------- | -------------------------------------- |
| `id`         | `int` PK    | autoincrement |                                        |
| `name`       | `str`       | required      |                                        |
| `parent_id`  | `int?` FK   | `None`        | → `folder.id` (self-ref, optional)     |
| `created_at` | `datetime`  | `utcnow`      |                                        |

**Hierarchy:** `parent_id is None` → root. No depth limit enforced today.

---

## Entity: Tag

**Table:** `tag` · **Model:** `api/models/tag.py`

| Field        | Type        | Default              | Notes                                   |
| ------------ | ----------- | -------------------- | --------------------------------------- |
| `id`         | `int` PK    | autoincrement        |                                         |
| `name`       | `str`       | required, **unique** | Indexed                                 |
| `color`      | `str`       | `DEFAULT_TAG_COLOR`  | Hex (e.g. `#10b981`)                    |
| `created_at` | `datetime`  | `utcnow`             |                                         |

---

## Entity: FlashcardTag (association)

**Table:** `flashcard_tag` · **Model:** `api/models/flashcard_tag.py`

| Field          | Type     | Notes                                  |
| -------------- | -------- | -------------------------------------- |
| `flashcard_id` | `int` PK | → `flashcard.id` (composite PK)        |
| `tag_id`       | `int` PK | → `tag.id` (composite PK)              |

Pure association — no payload. Add a payload field here only if it's truly per-link
(e.g. `weight`); per-tag metadata belongs on `Tag`.

---

## Schemas vs Models — naming

For every entity `X` you usually have:
- `models/x.py` — `class X(SQLModel, table=True)` (DB table)
- `schemas/x.py` — `XCreate`, `XRead`, `XUpdate` (API I/O)

Never reuse a model as an API response. Always go through a `Read` schema.

---

## Adding a new entity — checklist

1. `api/models/<name>.py` — SQLModel table.
2. Register it in `api/models/__init__.py`.
3. `api/schemas/<name>.py` — `Create`, `Read`, `Update` shapes.
4. `api/services/<name>.py` — business logic, no FastAPI imports.
5. `api/routers/<name>.py` — thin HTTP layer.
6. Register router in `api/main.py`.
7. If altering an existing table: add migration in `api/migrations.py` with safe default.
8. Tests in `api/tests/test_<name>.py`.
9. **Update this file** — entity table, diagram, relationships.

---

## Extending an existing entity — questions to ask first

Before adding a field, ask:
- Does an existing field already cover this (even partially)?
- Would this be cleaner as a **new entity** with a relationship?
- Will every existing row have a sensible default? (SQLite migration needs it.)
- Does this change any service's invariants (e.g. SM-2 state, folder hierarchy)?
- Will the `Read` schema need to expose this? Will the frontend?

---

## Changelog

- **2026-04-25** — Initial entity reference written. Covers Video, Flashcard, Summary,
  Folder, Tag, FlashcardTag as they exist on `main` after the batch-processing feature.
