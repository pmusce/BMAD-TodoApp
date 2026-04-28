# Story 3.2: `useTasks` Hook

Status: done

## Story

As a developer,
I want a `useTasks` custom hook that owns all task state and exposes CRUD operations,
so that components are only responsible for rendering and never contain data-fetching or state logic.

## Acceptance Criteria

1. **Given** `client/src/hooks/useTasks.ts` exists **When** called from a component **Then** it returns `{ tasks: Task[], isLoading: boolean, error: string | null, createTask, toggleTask, deleteTask }`

2. **Given** the component mounts for the first time **When** the initial fetch is in flight **Then** `isLoading` is `true`; once the fetch resolves (success or error) `isLoading` becomes `false` and never returns to `true`

3. **Given** `createTask`, `toggleTask`, or `deleteTask` is called **When** the mutation is in flight **Then** `isLoading` remains `false` — mutations use the optimistic UI pattern and do NOT show a loading indicator

4. **Given** any mutation is called **When** it follows the optimistic UI 3-step pattern **Then**: (1) local state is updated immediately, (2) API call is fired, (3a) on success the local state is confirmed/updated with server response, (3b) on failure local state is rolled back to the pre-mutation snapshot and `error` is set to a user-facing string

5. **Given** `error` is non-null after a failed mutation **When** the next operation of the same type succeeds **Then** `error` is reset to `null`

6. **Given** a mutation has failed and `error` is non-null **When** the user re-triggers the same action **Then** the retry is treated as a fresh operation — no dedicated retry button exists; re-triggering the action is the retry mechanism

7. **Given** `client/src/hooks/useTasks.test.ts` exists co-located **When** run via Vitest **Then** it passes ≥7 test cases: initial load success, initial load error, createTask success (optimistic + confirm), createTask rollback on API error, toggleTask success, toggleTask rollback, deleteTask success, deleteTask rollback

## Tasks / Subtasks

- [x] Create `client/src/hooks/` directory (does not exist yet) (AC: 1)
- [x] Implement `client/src/hooks/useTasks.ts` (AC: 1–6)
  - [x] Export named function `useTasks` (no default export)
  - [x] Import `getTasks`, `createTask`, `updateTask`, `deleteTask` from `../api/tasksApi`
  - [x] Import `Task` from `@shared/types`
  - [x] Initialise state: `tasks: Task[]`, `isLoading: boolean`, `error: string | null`
  - [x] Fetch all tasks on mount (`useEffect`): set `isLoading = true` before fetch, `false` after
  - [x] Implement `createTask(text: string)` with optimistic UI 3-step pattern
  - [x] Implement `toggleTask(id: number)` with optimistic UI 3-step pattern (calls `updateTask(id, { completed: !task.completed })`)
  - [x] Implement `deleteTask(id: number)` with optimistic UI 3-step pattern
  - [x] Reset `error` to `null` at the start of each successful mutation of the same type
  - [x] Use user-facing error strings (never raw `Error.message` or 500 API `message`)
- [x] Create co-located test file `client/src/hooks/useTasks.test.ts` (AC: 7)
  - [x] Mock `../api/tasksApi` module boundary (do NOT mock `fetch` — mock the `tasksApi` module itself)
  - [x] Test: initial load — `isLoading` true then false, tasks populated
  - [x] Test: initial load error — `isLoading` false, `error` set to user-facing string
  - [x] Test: `createTask` success — optimistic update applied immediately, confirmed by server response
  - [x] Test: `createTask` rollback — state reverts to snapshot on API error, `error` non-null
  - [x] Test: `toggleTask` success — local state updated, confirmed by server response
  - [x] Test: `toggleTask` rollback — state reverts, `error` non-null
  - [x] Test: `deleteTask` success — task removed from state
  - [x] Test: `deleteTask` rollback — state reverts, `error` non-null
  - [x] Test: successful retry after failed mutation clears `error`

## Dev Notes

### ⚠️ Directory Does Not Exist Yet

`client/src/hooks/` does **not** exist. Create it as the first step.

---

### State Shape — Fixed, Do Not Deviate

```typescript
// Exact return type — do NOT introduce a status enum
{
  tasks: Task[]
  isLoading: boolean       // true ONLY during initial fetch
  error: string | null     // user-facing string; null when no error
  createTask: (text: string) => Promise<void>
  toggleTask: (id: number) => Promise<void>
  deleteTask: (id: number) => Promise<void>
}
```

**Why not `status: 'idle' | 'loading' | 'success' | 'error'`?** A status enum cannot simultaneously represent "data loaded but mutation errored" — the fixed shape above can. Do not change it.

---

### Optimistic UI 3-Step Pattern — Mandatory for All 3 Mutations

```typescript
// Pattern to follow for createTask, toggleTask, deleteTask:

async function createTask(text: string): Promise<void> {
  // Step 1 — snapshot current state
  const snapshot = tasks

  // Step 2 — apply optimistic change immediately
  const optimisticTask: Task = {
    id: Date.now(),          // temporary id; replaced by server response
    text: text.trim(),
    completed: false,
    createdAt: Date.now(),
    userId: null,
  }
  setTasks(prev => [optimisticTask, ...prev])
  setError(null)             // clear previous error of same type

  try {
    // Step 3a — confirm with server response
    const created = await tasksApi.createTask(text)
    setTasks(prev => prev.map(t => t.id === optimisticTask.id ? created : t))
  } catch {
    // Step 3b — rollback to snapshot
    setTasks(snapshot)
    setError('Failed to create task. Please try again.')
  }
}
```

Apply the same pattern for `toggleTask` (patch with opposite `completed`) and `deleteTask` (filter out id optimistically).

---

### `isLoading` Rule — Initial Fetch Only

```typescript
// CORRECT
useEffect(() => {
  setIsLoading(true)
  getTasks()
    .then(data => setTasks(data))
    .catch(() => setError('Failed to load tasks.'))
    .finally(() => setIsLoading(false))
}, [])

// WRONG — never do this in mutations:
// setIsLoading(true)   ← forbidden during createTask / toggleTask / deleteTask
```

---

### Error String Rules

- Errors shown in the UI must be **user-facing** — plain English, actionable.
- **Never** expose `err.message` raw if it could contain a 500 internal message.
- Suggested strings:
  - Load failure: `'Failed to load tasks.'`
  - Create failure: `'Failed to create task. Please try again.'`
  - Toggle failure: `'Failed to update task. Please try again.'`
  - Delete failure: `'Failed to delete task. Please try again.'`
- `error` MUST be reset to `null` at the **start** of the next successful operation of the same type (before the API call).

---

### What `useTasks` Consumes from Story 3.1

`client/src/api/tasksApi.ts` already exists (Story 3.1 done). Import from it:

```typescript
import { getTasks, createTask as apiCreateTask, updateTask, deleteTask as apiDeleteTask } from '../api/tasksApi'
```

Or:

```typescript
import * as tasksApi from '../api/tasksApi'
```

The module exports: `getTasks(): Promise<Task[]>`, `createTask(text): Promise<Task>`, `updateTask(id, patch): Promise<Task>`, `deleteTask(id): Promise<void>`. All non-2xx responses throw a typed `ApiError` — never return `undefined` on failure.

---

### Architecture Compliance Checklist

| Rule | Detail |
|------|--------|
| ✅ Named export only | `export function useTasks()` — no default export |
| ✅ Types from `@shared/types` | Import `Task` (and `UpdateTaskPayload` if needed) — never redefine |
| ✅ `isLoading` = initial fetch only | Mutations are fire-and-forget with optimistic UI — never flip `isLoading` |
| ✅ Fixed state shape | `{ tasks, isLoading, error, createTask, toggleTask, deleteTask }` |
| ✅ `error` resets on success | Clear `error` at the start of the next successful same-type operation |
| ✅ No `fetch` in hook | All HTTP goes via `tasksApi` — hook never calls `fetch` directly |
| ✅ Called once at `HomePage` | This hook is designed to be called once and props drilled — do NOT make it a context provider |
| ✅ User-facing error strings | No raw API error messages from 500 responses in UI |

---

### Test Mock Boundary

Mock the **`tasksApi` module** — not `fetch`. This is the project-mandated mock boundary for hook tests:

```typescript
// useTasks.test.ts
import { vi } from 'vitest'
import * as tasksApi from '../api/tasksApi'

vi.mock('../api/tasksApi')

const mockGetTasks = vi.mocked(tasksApi.getTasks)
```

Use `renderHook` from `@testing-library/react` to test the hook:

```typescript
import { renderHook, act } from '@testing-library/react'
import { useTasks } from './useTasks'
```

Minimum 7 test cases (8 recommended to cover retry-clears-error scenario):

| # | Scenario | Key assertion |
|---|----------|---------------|
| 1 | Initial load success | tasks populated, isLoading false |
| 2 | Initial load error | error non-null, isLoading false |
| 3 | `createTask` success | optimistic task appears, then confirmed by server response |
| 4 | `createTask` rollback | tasks reverts to snapshot, error set |
| 5 | `toggleTask` success | task.completed flips, confirmed by server |
| 6 | `toggleTask` rollback | reverts, error set |
| 7 | `deleteTask` success | task removed |
| 8 | `deleteTask` rollback | reverts, error set |

---

### File Structure

```
client/src/
  api/
    tasksApi.ts            ← already exists (Story 3.1) — do NOT modify
    tasksApi.test.ts       ← already exists — do NOT modify
  hooks/                   ← CREATE this directory
    useTasks.ts            ← NEW
    useTasks.test.ts       ← NEW
```

---

### Project Context References

- [project-context.md: Framework-Specific Rules → React / Frontend](_bmad-output/project-context.md) — `useTasks` state shape, `isLoading` rules, optimistic UI pattern, error string rules
- [project-context.md: Testing Rules → Mock Boundaries](_bmad-output/project-context.md) — hook tests mock `tasksApi` module
- [project-context.md: Testing Rules → Frontend Testing](_bmad-output/project-context.md) — Vitest + RTL, `renderHook`
- [project-context.md: Imports & Exports](_bmad-output/project-context.md) — named exports, `@shared/types`
- [epics.md: Story 3.2](_bmad-output/planning-artifacts/epics.md) — canonical acceptance criteria
- [3-1-tasks-api-client.md](_bmad-output/implementation-artifacts/3-1-tasks-api-client.md) — API contract for `tasksApi` module

---

### Previous Story Intelligence (Story 3.1)

- `client/src/api/tasksApi.ts` is fully implemented and tested.
- `handleResponse` robustly handles empty bodies, non-JSON bodies, and always throws a typed `ApiError` on non-2xx.
- A re-entrant `isApiError` type guard is used internally — do not duplicate it in the hook.
- Non-2xx responses always throw — the hook's `catch` block will always receive an `ApiError` (or generic `Error`). Both cases should result in a user-facing error string.
- Review finding from 3.1 that was patched: empty/non-JSON error bodies are now handled safely.

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

- Created `client/src/hooks/` directory (new)
- Implemented `useTasks.ts`: named export, `useState`+`useEffect` for initial fetch (`isLoading` true→false), optimistic UI 3-step pattern for all 3 mutations, user-facing error strings, rollback on failure, `error` cleared on each fresh attempt
- `useTasks.test.ts`: 9 tests via `renderHook`+`act`, mocking `tasksApi` module boundary — all pass
- Full client test suite: 23 tests, 0 failures
- ESLint: 0 errors
- ✅ Resolved review finding [Patch]: pass `text.trim()` to `tasksApi.createTask` (was passing raw text)
- ✅ Resolved review finding [Patch]: per-type error isolation via `errorSource` ref — `setError(null)` only fires when same mutation type succeeds (AC5 compliant)
- ✅ Resolved review finding [Patch]: `useEffect` cleanup with `cancelled` flag prevents stale updates on unmount / StrictMode double-fire
- ✅ Resolved review finding [Patch]: monotonic negative optimistic ID via `nextOptimisticId` ref — eliminates `Date.now()` sub-ms collision
- ✅ Resolved review finding [Patch]: added `toHaveBeenCalledWith` assertion in createTask success test; added trim and cross-type isolation tests
- Final test count: 11 hook tests, 25 total — all pass

### File List

- `client/src/hooks/useTasks.ts` — NEW
- `client/src/hooks/useTasks.test.ts` — NEW

### Review Findings

- [x] [Review][Patch] `createTask` passes raw untrimmed text to API — optimistic shows `text.trim()` but `tasksApi.createTask(text)` is called with original; server stores untrimmed, confirmed task text diverges [useTasks.ts:31]
- [x] [Review][Patch] `setError(null)` clears cross-type errors — violates AC5; calling `toggleTask` or `deleteTask` silently discards an outstanding `createTask` error before user retries that type [useTasks.ts:30,45,60]
- [x] [Review][Patch] No cleanup in `useEffect` — React 18 StrictMode double-fires the effect; two concurrent `getTasks` calls race; add a `cancelled` flag and return a cleanup function [useTasks.ts:10-17]
- [x] [Review][Patch] `Date.now()` optimistic ID collision — two `createTask` calls within the same millisecond get identical ids; first API response replaces both optimistic entries silently; use a negative monotonic counter instead [useTasks.ts:22]
- [x] [Review][Patch] `createTask` success test missing API argument assertion — add `expect(mockCreateTask).toHaveBeenCalledWith('New task')` to verify trimmed text is passed [useTasks.test.ts:~50]
- [x] [Review][Defer] Stale snapshot / ghost-restore under concurrent mutations (e.g. deleteTask double-click) [useTasks.ts:19,54] — deferred, pre-existing concurrent-mutation limitation outside story scope
- [x] [Review][Defer] `toggleTask` stale `.completed` on rapid double-call [useTasks.ts:41] — deferred, concurrent mutation concern beyond story scope
