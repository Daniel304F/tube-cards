# Coding Conventions

Conventions that apply across the entire project.
Both frontend (React) and backend (FastAPI) must follow these.

---

## General Principles

- **Clarity over cleverness** — code is read far more than it is written
- **One responsibility per unit** — functions, components, and services do one thing well
- **Explicit over implicit** — avoid magic, hidden side effects, and surprising behavior
- **Fail loudly** — surface errors immediately with clear messages, never swallow them silently
- **Consistency** — follow existing patterns in the codebase, even if you'd do it differently

---

## Naming

### Universal

| Thing            | Convention      | Example                        |
| ---------------- | --------------- | ------------------------------ |
| Files (frontend) | kebab-case      | `flashcard-list.jsx`           |
| Files (backend)  | snake_case      | `flashcard_service.py`         |
| Components       | PascalCase      | `FlashcardList`                |
| Hooks            | camelCase + use | `useFlashcards`                |
| Functions        | camelCase (JS)  | `fetchFlashcards`              |
| Functions        | snake_case (Py) | `get_flashcard_by_id`          |
| Constants        | SCREAMING_SNAKE | `MAX_TRANSCRIPT_LENGTH`        |
| Types/Interfaces | PascalCase      | `FlashcardCreate`, `VideoRead` |
| Boolean vars     | is/has prefix   | `isLoading`, `hasError`        |

### Be Descriptive

```js
// BAD
const data = await get(id);
const x = items.filter((i) => i.a);

// GOOD
const flashcard = await fetchFlashcardById(id);
const activeFlashcards = flashcards.filter((f) => f.isActive);
```

---

## Functions & Methods

- **Single responsibility** — if you need "and" to describe what a function does, split it
- **Max ~40 lines** — if longer, extract helpers
- **Max 3 parameters** — if more are needed, use an object/dataclass
- **Pure where possible** — same input always produces same output, no hidden state

```python
# BAD — does too much, hard to test
async def process_video(url: str, session: Session) -> dict:
    transcript = fetch_transcript(url)
    flashcards = call_llm(transcript)
    for f in flashcards:
        session.add(Flashcard(**f))
    session.commit()
    notion_sync(flashcards)
    return {"count": len(flashcards)}

# GOOD — each step is isolated and testable
async def process_video(url: str, session: Session) -> list[FlashcardRead]:
    transcript = await transcript_service.fetch(url)
    flashcards = await flashcard_service.generate_from_transcript(transcript, session)
    return flashcards
```

---

## Comments

Write comments for **why**, not **what**. The code shows what — the comment explains intent.

```js
// BAD — restates the code
// increment counter
count++;

// GOOD — explains non-obvious reason
// YouTube transcript API returns chunks with ~5s overlap — deduplicate before sending to LLM
const deduped = deduplicateChunks(transcript);
```

- Remove all TODO comments before committing unless they reference a tracked issue
- No commented-out code in commits

---

## Error Handling

### Frontend

```js
// In hooks — catch at the boundary, expose structured error state
const [error, setError] = useState(null);

try {
  const data = await fetchFlashcards();
  setFlashcards(data);
} catch (err) {
  setError(err.response?.data?.detail ?? "Unexpected error");
}
```

- Always show an error state to the user — never silently fail
- Log unexpected errors to the console in development

### Backend

```python
# Use HTTPException with meaningful detail messages
raise HTTPException(status_code=404, detail="Flashcard not found")
raise HTTPException(status_code=422, detail="Invalid YouTube URL")
raise HTTPException(status_code=502, detail="LLM provider unavailable")

# Use logging — never print()
logger = logging.getLogger(__name__)
logger.error("Transcript fetch failed for %s: %s", url, str(e))
```

---

## No Magic Numbers or Strings

```python
# BAD
if len(transcript) > 12000:
    transcript = transcript[:12000]

# GOOD
MAX_TRANSCRIPT_CHARS = 12_000

if len(transcript) > MAX_TRANSCRIPT_CHARS:
    transcript = transcript[:MAX_TRANSCRIPT_CHARS]
```

---

## File & Folder Organization

- One component per file (frontend)
- One router per domain (backend)
- Group by feature, not by type where it aids clarity
- Index files (`index.js`) for clean imports from component folders:

```js
// components/flashcard-card/index.js
export { FlashcardCard } from "./FlashcardCard";
```

---

## Git & Commits

Commit message format: `type(scope): short description`

| Type     | When to use                     |
| -------- | ------------------------------- |
| feat     | New feature                     |
| fix      | Bug fix                         |
| refactor | Code change, no behavior change |
| style    | Formatting, no logic change     |
| docs     | Documentation only              |
| chore    | Build, deps, config             |
| test     | Tests only                      |

Examples:

```
feat(api): add flashcard bulk export endpoint
fix(client): correct empty state on history page
refactor(api): extract get_or_404 helper to database.py
chore: update pydantic-settings to 2.7
```

- One logical change per commit
- Never commit broken code to main
- Never commit `.env` files — verify `.gitignore` first

---

## Environment & Config

- All environment-specific values live in `.env` — never in source code
- `.env.example` is always committed and always reflects all required variables
- Frontend: `VITE_` prefix, accessed via `import.meta.env`
- Backend: Pydantic Settings via `core/config.py` — never `os.environ` directly

---

## Dependency Management

- Frontend: `npm install <package>` — update library table in root `CLAUDE.md`
- Backend: `pip install <package>` — update library table in root `CLAUDE.md` and `requirements.txt`
- Never install a library without a clear, specific reason
- Prefer well-maintained, widely-used packages over obscure ones
- After installing: verify it works before committing
