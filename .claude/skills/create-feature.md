# Skill: Create New Feature

Use this skill when asked to create a new feature that spans both frontend and backend.

## Order of Operations

Always follow this exact order — never skip steps:

1. **API: Model** → `api/models/<name>.py`
2. **API: Schema** → `api/schemas/<name>.py`
3. **API: Service** → `api/services/<name>.py`
4. **API: Router** → `api/routers/<name>.py`
5. **API: Register router** → `api/main.py`
6. **Client: API file** → `client/src/api/<name>.js`
7. **Client: Hook** → `client/src/hooks/use<Name>.js`
8. **Client: Component(s)** → `client/src/components/<name>/`
9. **Client: Page** → `client/src/pages/<name>/`
10. **Root CLAUDE.md** → update library table if any new packages were installed

## Step 1 — Model (`api/models/<name>.py`)

```python
from datetime import datetime
from sqlmodel import SQLModel, Field


class <Name>(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    # fields here
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

- Import and register in `database.py` so `create_all` picks it up

## Step 2 — Schemas (`api/schemas/<name>.py`)

Always create all three:

```python
from sqlmodel import SQLModel


class <Name>Create(SQLModel):
    # required fields for creation

class <Name>Read(SQLModel):
    id: int
    # all fields returned to client
    created_at: datetime
    updated_at: datetime

class <Name>Update(SQLModel):
    # all fields optional
    field: str | None = None
```

## Step 3 — Service (`api/services/<name>.py`)

- No FastAPI imports — services must be testable independently
- Use `get_or_404` from `database.py` for all single-item fetches
- All functions fully typed

```python
from sqlmodel import Session, select
from models.<name> import <Name>
from schemas.<name> import <Name>Create, <Name>Update
from database import get_or_404


def get_all(session: Session) -> list[<Name>]:
    return list(session.exec(select(<Name>)).all())

def get_by_id(session: Session, id: int) -> <Name>:
    return get_or_404(session, <Name>, id)

def create(session: Session, data: <Name>Create) -> <Name>:
    obj = <Name>.model_validate(data)
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def update(session: Session, id: int, data: <Name>Update) -> <Name>:
    obj = get_or_404(session, <Name>, id)
    obj.sqlmodel_update(data.model_dump(exclude_unset=True))
    session.add(obj)
    session.commit()
    session.refresh(obj)
    return obj

def delete(session: Session, id: int) -> None:
    obj = get_or_404(session, <Name>, id)
    session.delete(obj)
    session.commit()
```

## Step 4 — Router (`api/routers/<name>.py`)

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from database import get_session
from schemas.<name> import <Name>Create, <Name>Read, <Name>Update
from services import <name> as <name>_service

router = APIRouter(prefix="/<names>", tags=["<names>"])


@router.get("/", response_model=list[<Name>Read])
async def list_<names>(session: Session = Depends(get_session)) -> list[<Name>Read]:
    return <name>_service.get_all(session)


@router.get("/{id}", response_model=<Name>Read)
async def get_<name>(id: int, session: Session = Depends(get_session)) -> <Name>Read:
    return <name>_service.get_by_id(session, id)


@router.post("/", response_model=<Name>Read, status_code=201)
async def create_<name>(data: <Name>Create, session: Session = Depends(get_session)) -> <Name>Read:
    return <name>_service.create(session, data)


@router.patch("/{id}", response_model=<Name>Read)
async def update_<name>(id: int, data: <Name>Update, session: Session = Depends(get_session)) -> <Name>Read:
    return <name>_service.update(session, id, data)


@router.delete("/{id}", status_code=204)
async def delete_<name>(id: int, session: Session = Depends(get_session)) -> None:
    <name>_service.delete(session, id)
```

## Step 5 — Register in main.py

```python
from routers import <name>
app.include_router(<name>.router)
```

## Step 6 — Client API file (`client/src/api/<name>.js`)

```js
import client from './client'

export async function fetch<Names>() {
  const res = await client.get('/<names>/')
  return res.data
}

export async function fetch<Name>ById(id) {
  const res = await client.get(`/<names>/${id}`)
  return res.data
}

export async function create<Name>(data) {
  const res = await client.post('/<names>/', data)
  return res.data
}

export async function update<Name>(id, data) {
  const res = await client.patch(`/<names>/${id}`, data)
  return res.data
}

export async function delete<Name>(id) {
  await client.delete(`/<names>/${id}`)
}
```

## Step 7 — Hook (`client/src/hooks/use<Name>.js`)

```js
import { useState, useEffect } from 'react'
import { fetch<Names> } from '@/api/<name>'

export function use<Names>() {
  const [<names>, set<Names>] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  async function load() {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetch<Names>()
      set<Names>(data)
    } catch (err) {
      setError(err.response?.data?.detail ?? 'Failed to load')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return { <names>, isLoading, error, refetch: load }
}
```

## Step 8 — Component

See `create-component` skill for the full component checklist.
Minimum: loading state, error state, empty state, mobile-first layout.

## Step 9 — Page

- Thin wrapper: imports layout + components, no logic
- Mobile and desktop render correctly inside their respective layouts

## Step 10 — Update library table

If any new npm or pip packages were installed, update the library tables
in the **root CLAUDE.md** immediately before finishing.
