# Story 3.1: Tasks API Client

Status: done

## Story

As a developer,
I want a dedicated `tasksApi.ts` module that wraps all `fetch` calls to the backend,
So that every HTTP detail is centralised in one file and no other module ever calls `fetch` directly.

## Acceptance Criteria

1. **Given** `client/src/api/tasksApi.ts` exists **When** reviewed **Then** it exports `getTasks()`, `createTask(text)`, `updateTask(id, patch)`, and `deleteTask(id)` — no other file in `client/src/` calls `fetch`

2. **Given** any of the four functions receives a non-2xx HTTP response **When** the response is parsed **Then** a typed `ApiError` (from `@shared/types`) is thrown — the function never returns `undefined` on failure

3. **Given** `getTasks()` is called and the server returns 200 **When** the response is parsed **Then** it returns a `Task[]` typed via `@shared/types` with all fields in `camelCase`

4. **Given** `createTask("Buy milk")` is called **When** the server returns 201 **Then** it returns the created `Task` object typed via `@shared/types`

5. **Given** `VITE_API_URL` is set in the client environment **When** any function builds the request URL **Then** it uses `import.meta.env.VITE_API_URL` as the base — no hardcoded `localhost` URLs

## Tasks / Subtasks

- [x] Create `client/src/api/` directory and `tasksApi.ts` module (AC: 1, 2, 3, 4, 5)
  - [x] Export `getTasks(): Promise<Task[]>` — GET `/api/tasks`
  - [x] Export `createTask(text: string): Promise<Task>` — POST `/api/tasks`
  - [x] Export `updateTask(id: number, patch: UpdateTaskPayload): Promise<Task>` — PATCH `/api/tasks/:id`
  - [x] Export `deleteTask(id: number): Promise<void>` — DELETE `/api/tasks/:id`
  - [x] Implement shared error-handling helper: parse JSON body and throw `ApiError` for all non-2xx responses
  - [x] Use `import.meta.env.VITE_API_URL` as the base URL throughout
- [x] Create co-located test file `client/src/api/tasksApi.test.ts` (AC: 1–5)
  - [x] Test: `getTasks` returns `Task[]` on 200
  - [x] Test: `createTask` returns `Task` on 201
  - [x] Test: `updateTask` returns updated `Task` on 200
  - [x] Test: `deleteTask` resolves `void` on 204
  - [x] Test: non-2xx response causes `ApiError` to be thrown (test at least one endpoint)
  - [x] Test: `ApiError` thrown carries correct `statusCode`, `error`, `message` fields

### Review Findings

- [x] [Review][Patch] Non-2xx path can throw non-ApiError when error body is empty/non-JSON [client/src/api/tasksApi.ts:10]
- [x] [Review][Patch] Success path assumes JSON body for all non-204 responses and can fail on empty body [client/src/api/tasksApi.ts:8]
- [x] [Review][Patch] Missing tests for non-JSON/empty error response and request-shape assertions (URL/method/headers/body) [client/src/api/tasksApi.test.ts:13]

## Dev Notes

### What This Story Creates

| File | Action | Notes |
|------|--------|-------|
| `client/src/api/tasksApi.ts` | **NEW** | The only file in `client/src/` that ever calls `fetch` |
| `client/src/api/tasksApi.test.ts` | **NEW** | Co-located Vitest unit test |

**⚠️ The `client/src/api/` directory does not exist yet** — create it as part of this story.

---

### Architecture Compliance Checklist

| Rule | Detail |
|------|--------|
| ✅ Types from `@shared/types` only | Import `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError` — never redefine them |
| ✅ `@shared` alias resolves to `shared/types.ts` | Configured in `client/vite.config.ts` as `@shared → ../shared` |
| ✅ No hardcoded URLs | Base URL = `import.meta.env.VITE_API_URL` (dev value: `http://localhost:3000`) |
| ✅ Return types match API contract | `getTasks` → `Task[]`, `createTask` → `Task`, `updateTask` → `Task`, `deleteTask` → `void` |
| ✅ Throw `ApiError` on non-2xx | Never return `undefined`; always throw a typed error the hook can inspect |
| ✅ No default export | Use named exports (`export async function getTasks(...)`) |
| ✅ Dates as Unix ms numbers | `Task.createdAt` is a `number` — do not parse to `Date` object |
| ✅ No barrel `index.ts` | Single-module file; consumers import directly from `@/api/tasksApi` |

---

### API Endpoints Reference

| Function | Method | Path | Request Body | Success Status | Success Return |
|----------|--------|------|--------------|----------------|----------------|
| `getTasks()` | GET | `/api/tasks` | — | 200 | `Task[]` |
| `createTask(text)` | POST | `/api/tasks` | `{ "text": "…" }` | 201 | `Task` |
| `updateTask(id, patch)` | PATCH | `/api/tasks/:id` | `{ "completed": true\|false }` | 200 | `Task` |
| `deleteTask(id)` | DELETE | `/api/tasks/:id` | — | 204 | *(no body)* |

Error shape (any non-2xx):
```json
{ "statusCode": 400, "error": "Bad Request", "message": "body/text must be a non-empty string" }
```

---

### `Task` Interface (implementation-accurate)

```typescript
// shared/types.ts — single source of truth
export interface Task {
  id: number;
  text: string;
  completed: boolean;
  createdAt: number;        // Unix milliseconds — always a number, never an ISO string
  userId: number | null;    // reserved for future auth; always null in v1
}
```

> **Note:** `userId: number | null` is present in the live `shared/types.ts` even though some older architecture doc text may not mention it. Trust the implementation at `shared/types.ts`.

---

### Implementation Sketch

```typescript
// client/src/api/tasksApi.ts
import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from '@shared/types'

const BASE = import.meta.env.VITE_API_URL

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as unknown as T
    return res.json() as Promise<T>
  }
  // Parse JSON error body and throw typed ApiError
  const err: ApiError = await res.json()
  throw err
}

export async function getTasks(): Promise<Task[]> {
  const res = await fetch(`${BASE}/api/tasks`)
  return handleResponse<Task[]>(res)
}

export async function createTask(text: string): Promise<Task> {
  const body: CreateTaskPayload = { text }
  const res = await fetch(`${BASE}/api/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return handleResponse<Task>(res)
}

export async function updateTask(id: number, patch: UpdateTaskPayload): Promise<Task> {
  const res = await fetch(`${BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
  return handleResponse<Task>(res)
}

export async function deleteTask(id: number): Promise<void> {
  const res = await fetch(`${BASE}/api/tasks/${id}`, { method: 'DELETE' })
  return handleResponse<void>(res)
}
```

---

### Test Implementation Guidance

**Framework:** Vitest (already configured in `client/vite.config.ts`)
**Environment:** `jsdom` (set in `vite.config.ts` → `test.environment`)
**Setup file:** `client/src/test/setup.ts` imports `@testing-library/jest-dom/vitest` — no additional setup needed

**How to mock `fetch`:**
Use `vi.stubGlobal('fetch', vi.fn())` in `beforeEach` and restore with `vi.unstubAllGlobals()` in `afterEach`. This is cleaner than patching `globalThis.fetch` manually.

**Sample test skeleton:**

```typescript
// client/src/api/tasksApi.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getTasks, createTask, updateTask, deleteTask } from './tasksApi'
import type { Task } from '@shared/types'

const mockTask: Task = {
  id: 1, text: 'Buy milk', completed: false,
  createdAt: 1714167600000, userId: null,
}

function mockFetch(body: unknown, status = 200) {
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  }))
}

afterEach(() => vi.unstubAllGlobals())

describe('getTasks', () => {
  it('returns Task[] on 200', async () => {
    mockFetch([mockTask])
    const result = await getTasks()
    expect(result).toEqual([mockTask])
  })
})

// ... similar blocks for createTask, updateTask, deleteTask, and error cases
```

**Required test cases (≥6):**
1. `getTasks` — 200 returns `Task[]`
2. `createTask` — 201 returns created `Task`
3. `updateTask` — 200 returns updated `Task`
4. `deleteTask` — 204 resolves `void` (no thrown error)
5. Any function — 4xx response throws `ApiError` with correct shape (`statusCode`, `error`, `message`)
6. Any function — 5xx response throws `ApiError`

---

### Project Structure Notes

#### Alignment with unified project structure

```
client/src/
├── api/                    ← CREATE THIS DIRECTORY
│   ├── tasksApi.ts         ← CREATE
│   └── tasksApi.test.ts    ← CREATE (co-located)
├── App.tsx                 ← NO CHANGES needed this story
├── main.tsx                ← NO CHANGES needed this story
├── shared-types.smoke.test.ts
├── styles/
│   └── index.css
└── test/
    └── setup.ts
```

#### Current state of `client/src/`

Only existing files: `App.tsx`, `main.tsx`, `shared-types.smoke.test.ts`, `styles/index.css`, `test/setup.ts`.
The `api/`, `hooks/`, `components/`, and `pages/` directories are all created during Epic 3 stories — this story creates `api/`.

#### File naming
- Module file: `tasksApi.ts` (camelCase + `Api` suffix — matches architecture naming table)
- Test file: `tasksApi.test.ts` (same name + `.test.`)

---

### Vitest / TypeScript Environment Notes

- `client/tsconfig.json` has `"noEmit": true` and `"allowImportingTsExtensions": true` — this is already set and correct; do NOT change it
- The `@shared` path alias is configured both in `vite.config.ts` (for Vite/Vitest) and relies on `tsconfig.base.json` paths for TypeScript — both are already set up from Epic 1
- `import.meta.env.VITE_API_URL` is the correct way to read Vite env variables in TypeScript; Vitest uses the same mechanism via the jsdom environment

---

### Dependency on Other Stories

- **Depends on:** Story 2.3 (Task Route Handlers) — all 4 endpoints must exist at the server. ✅ **Already done & verified in Epic 2.**
- **Required by:** Story 3.2 (`useTasks` hook) — the hook imports from `tasksApi.ts`. This story must complete before Story 3.2 begins.

---

### Known Patterns from Previous Work

From the Epic 2 retro and existing code:
1. **No `src/` subdirectory** — the server workspace has no `src/` folder; similarly, the client has `client/src/` (Vite default). Paths are `client/src/api/tasksApi.ts`, not any other nesting.
2. **TypeScript strict mode** — `tsconfig.base.json` sets `"strict": true`. All functions must be fully typed; avoid `any`.
3. **Named exports, no default exports** — consistent with `App.tsx` which uses `export function App()`.
4. **`@shared/types` is the type authority** — do not create local type aliases; import directly.

### References

- Story requirements: [epics.md](../../_bmad-output/planning-artifacts/epics.md#story-31-tasks-api-client)
- API contract: [architecture.md](../../_bmad-output/planning-artifacts/architecture.md#api--communication-patterns)
- Naming conventions: [architecture.md](../../_bmad-output/planning-artifacts/architecture.md#naming-patterns)
- Optimistic UI (context for future stories): [architecture.md](../../_bmad-output/planning-artifacts/architecture.md#optimistic-ui-pattern)
- Shared types: [shared/types.ts](../../shared/types.ts)
- Vite config (alias + test env): [client/vite.config.ts](../../client/vite.config.ts)
- Test setup: [client/src/test/setup.ts](../../client/src/test/setup.ts)
- Epic 2 retrospective: [epic-2-retro-2026-04-28.md](./epic-2-retro-2026-04-28.md)

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Implemented `client/src/api/tasksApi.ts` with four named exports: `getTasks`, `createTask`, `updateTask`, `deleteTask`
- Shared `handleResponse<T>` helper handles non-2xx responses by throwing typed `ApiError`, and returns `undefined` as `T` for 204 (DELETE)
- All types imported exclusively from `@shared/types` — no local redefinitions
- Base URL uses `import.meta.env.VITE_API_URL` — no hardcoded localhost
- Created co-located `client/src/api/tasksApi.test.ts` with 6 tests covering all functions and error cases
- All 11 client tests pass; all 21 server tests unaffected
- Addressed code-review findings: hardened response parsing for non-JSON/empty bodies and added request-shape and boundary tests

### File List

- client/src/api/tasksApi.ts (NEW)
- client/src/api/tasksApi.test.ts (NEW)

## Change Log

- 2026-04-28: Story implemented — created `tasksApi.ts` and `tasksApi.test.ts`; all ACs satisfied; 6 new tests pass; status moved to review (Claude Sonnet 4.6)
- 2026-04-28: Code-review patches applied — fixed typed error fallbacks and empty-body handling; expanded tests to 9 cases; status moved to done
