# Story 2.4: Server Route Unit Tests

Status: done

## Story

As a developer,
I want unit tests for all four task route handlers that mock `TaskRepository`,
so that route logic is verified without a live database.

## Acceptance Criteria

1. **Given** `server/routes/taskRoutes.test.ts` exists co-located with `taskRoutes.ts`
   **When** run via `node --test`
   **Then** it passes all 7 test cases: `GET /api/tasks` → 200 + array, `POST /api/tasks` valid → 201 + Task, `POST /api/tasks` invalid text → 400, `PATCH /api/tasks/:id` valid → 200 + Task, `PATCH /api/tasks/:id` missing → 404, `DELETE /api/tasks/:id` → 204, error handler returns correct shape

2. **Given** the test file runs
   **When** tests execute
   **Then** no real SQLite file is opened — `TaskRepository` is stubbed/mocked via `node:test` `mock.module()`

3. **Given** the full server test suite is run (`npm test` in `server/`)
   **When** all 7 route tests pass
   **Then** total elapsed time is well under 1 second (no I/O latency from real DB)

## Tasks / Subtasks

- [x] Task 1 — Create `server/routes/taskRoutes.test.ts` (AC: 1, 2, 3)
  - [x] Register `TaskRepository` mock via `mock.module('../repositories/TaskRepository.ts', ...)` synchronously, before any dynamic import
  - [x] Dynamically import `taskRoutes` plugin via `await import('./taskRoutes.ts')` after mock registration
  - [x] Write helper `buildTestApp()` that creates a bare `Fastify` instance, decorates with `fastify.db` stub, registers `@fastify/sensible`, `errorHandlerPlugin`, and `taskRoutes` at prefix `/api/tasks`
  - [x] Test 1 — `GET /api/tasks` → 200 + task array
  - [x] Test 2 — `POST /api/tasks` with valid text → 201 + Task
  - [x] Test 3 — `POST /api/tasks` with empty string `""` → 400 (JSON Schema `minLength: 1` catches it); also test whitespace-only `"   "` → 400 (handler trim guard)
  - [x] Test 4 — `PATCH /api/tasks/:id` with existing id → 200 + updated Task
  - [x] Test 5 — `PATCH /api/tasks/:id` with non-existent id (mockUpdate returns `undefined`) → 404 `{ statusCode: 404, error: 'Not Found', message: 'Task 9999 not found' }`
  - [x] Test 6 — `DELETE /api/tasks/:id` → 204 (empty body, `mockDelete` called once)
  - [x] Test 7 — Error handler shape: make `mockFindAll` throw, verify response is `{ statusCode: 500, error: 'Internal Server Error', message: 'An unexpected error occurred' }` and no stack trace is present
  - [x] Reset mock function state between tests using `fn.mock.resetCalls()` at start of each test
  - [x] Each test shares one Fastify instance created in `before()` / closed in `after()`

- [x] Task 2 — Verify (AC: 3)
  - [x] `npm test` in `server/` → 21/21 pass (8 TaskRepository + 8 taskRoutes + 5 shared-types smoke = 21 total)
  - [x] `npx tsc --noEmit -p server/tsconfig.test.json` → 0 type errors
  - [x] No `.db` files created in `server/data/` during test run

## Dev Notes

### CRITICAL: No `src/` Subdirectory

Server layout is flat (established Story 2.1). The new file goes at:
```
server/routes/taskRoutes.test.ts   ← NEW (co-located with taskRoutes.ts)
```
Do NOT create `server/src/routes/taskRoutes.test.ts`.

### CRITICAL: `mock.module()` Must Be Called Before Dynamic Import

The `TaskRepository` is constructed inside `taskRoutes.ts` at plugin registration time (`const repo = new TaskRepository(fastify.db)`). The only way to intercept it without modifying production code is using `node:test`'s `mock.module()`.

**Order requirement:**
1. Static imports at the top of the file (hoisted by ESM — they run first)
2. `mock.module('../repositories/TaskRepository.ts', ...)` — called synchronously
3. `await import('./taskRoutes.ts')` — loads the mocked world

**WRONG pattern (breaks the mock):**
```typescript
// ❌ Static import causes TaskRepository to load BEFORE mock.module() runs
import taskRoutes from './taskRoutes.ts'
mock.module('../repositories/TaskRepository.ts', { ... }) // too late!
```

**CORRECT pattern:**
```typescript
// ✅ mock.module() runs synchronously, then dynamic import loads the mocked module
mock.module('../repositories/TaskRepository.ts', {
  namedExports: {
    TaskRepository: class MockTaskRepository { ... }
  }
})
const { default: taskRoutes } = await import('./taskRoutes.ts')
```

### `mock.module()` Specifier Path

From `server/routes/taskRoutes.test.ts`, the specifier must be `'../repositories/TaskRepository.ts'` — the same relative path that `taskRoutes.ts` uses. Node.js resolves both to the same module URL (`file:///.../server/repositories/TaskRepository.ts`), so the mock intercepts correctly.

### Minimal Test App Pattern (No Autoload)

Do NOT use the full `app.ts` factory with `@fastify/autoload` — that loads everything from disk and requires a real DB plugin. Build a minimal Fastify instance instead:

```typescript
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import errorHandlerPlugin from '../plugins/errorHandler.ts'

async function buildTestApp() {
  const app = Fastify({ logger: false })
  // Decorate db — MockTaskRepository ignores the argument but TaskRepository
  // constructor accesses fastify.db, so the decoration must exist.
  app.decorate('db', {} as any)
  await app.register(sensible)
  await app.register(errorHandlerPlugin)
  // Register routes at the same prefix autoload would use
  await app.register(taskRoutes, { prefix: '/api/tasks' })
  await app.ready()
  return app
}
```

**Why `{ prefix: '/api/tasks' }`?** The `autoPrefix` export on `taskRoutes.ts` is read by `@fastify/autoload` at runtime. In tests, we bypass autoload and must supply the prefix manually to match the real URL paths. Tests must inject to `/api/tasks` and `/api/tasks/:id`.

**Why `await app.ready()`?** Forces all plugins to initialize synchronously. Without it, `app.inject()` may run before plugins are registered. Alternatively, `app.inject()` itself calls `ready()` internally in Fastify v5, so it's safe to omit, but being explicit avoids subtle ordering bugs.

### Mock Functions Design

Using `mock.fn()` from `node:test` — declare mock functions at the **module level** so all test suites share the same mock references. Reset call counts (but not implementations) at the top of each test.

```typescript
const mockTask = {
  id: 1,
  text: 'Buy milk',
  completed: false,
  createdAt: 1704067200000,
  userId: null,
}

const mockFindAll = mock.fn(() => [mockTask])
const mockCreate = mock.fn(() => mockTask)
const mockUpdate = mock.fn<[number, { completed: boolean }], typeof mockTask | undefined>(
  () => mockTask
)
const mockDelete = mock.fn(() => true)
```

**Resetting between tests:**
```typescript
// At start of every it() block:
mockFindAll.mock.resetCalls()
mockCreate.mock.resetCalls()
mockUpdate.mock.resetCalls()
mockDelete.mock.resetCalls()
```

**To change return value for a specific test (e.g., PATCH → 404):**
```typescript
mockUpdate.mock.mockImplementationOnce(() => undefined)
```

### MockTaskRepository Class

```typescript
mock.module('../repositories/TaskRepository.ts', {
  namedExports: {
    TaskRepository: class MockTaskRepository {
      constructor(_db: unknown) {}
      findAll() { return mockFindAll() }
      create(payload: { text: string }) { return mockCreate(payload) }
      update(id: number, patch: { completed: boolean }) { return mockUpdate(id, patch) }
      delete(id: number) { return mockDelete(id) }
    },
  },
})
```

### Test Injection Examples

```typescript
// GET
const res = await app.inject({ method: 'GET', url: '/api/tasks' })
assert.equal(res.statusCode, 200)
assert.deepStrictEqual(res.json(), [mockTask])

// POST valid
const res = await app.inject({
  method: 'POST',
  url: '/api/tasks',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: 'Buy milk' }),
})
assert.equal(res.statusCode, 201)

// POST invalid — empty string (JSON Schema rejects minLength: 1)
const res = await app.inject({
  method: 'POST',
  url: '/api/tasks',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: '' }),
})
assert.equal(res.statusCode, 400)

// POST invalid — whitespace only (handler trim guard rejects it)
const res = await app.inject({
  method: 'POST',
  url: '/api/tasks',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ text: '   ' }),
})
assert.equal(res.statusCode, 400)

// PATCH 404
mockUpdate.mock.mockImplementationOnce(() => undefined)
const res = await app.inject({
  method: 'PATCH',
  url: '/api/tasks/9999',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ completed: true }),
})
assert.equal(res.statusCode, 404)
const body = res.json<{ statusCode: number; error: string; message: string }>()
assert.equal(body.statusCode, 404)
assert.equal(body.error, 'Not Found')
assert.equal(body.message, 'Task 9999 not found')

// DELETE 204
const res = await app.inject({
  method: 'DELETE',
  url: '/api/tasks/1',
})
assert.equal(res.statusCode, 204)
assert.equal(res.body, '') // empty body — never JSON.parse on 204

// Error handler shape (500)
mockFindAll.mock.mockImplementationOnce(() => { throw new Error('DB exploded') })
const res = await app.inject({ method: 'GET', url: '/api/tasks' })
assert.equal(res.statusCode, 500)
const body = res.json<{ statusCode: number; error: string; message: string }>()
assert.equal(body.statusCode, 500)
assert.equal(body.error, 'Internal Server Error')
assert.equal(body.message, 'An unexpected error occurred')
assert.ok(!('stack' in body), 'stack trace must NOT appear in error response')
```

### ESM Import Extensions

Tests use NodeNext module resolution — import local `.ts` files with `.ts` extension:
```typescript
import errorHandlerPlugin from '../plugins/errorHandler.ts'
// NOT: '../plugins/errorHandler.js' or '../plugins/errorHandler'
```

npm package imports have no extension:
```typescript
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
```

### `tsconfig.test.json` Is Already Configured

`server/tsconfig.test.json` includes `**/*.test.ts` — no changes needed to TypeScript config. The new test file is automatically picked up by both `node --test` (runtime) and the test tsconfig (type checking).

### Import Ordering in Test File

Due to the `mock.module()` constraint, imports are split across static and dynamic:

```typescript
// === STATIC IMPORTS (all imports that do NOT pull in TaskRepository or taskRoutes) ===
import { mock, describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import Fastify from 'fastify'
import sensible from '@fastify/sensible'
import errorHandlerPlugin from '../plugins/errorHandler.ts'

// === MOCK SETUP (synchronous — must run before dynamic import below) ===
const mockTask = { ... }
const mockFindAll = mock.fn(...)
// ... other mock functions ...

mock.module('../repositories/TaskRepository.ts', {
  namedExports: { TaskRepository: class MockTaskRepository { ... } }
})

// === DYNAMIC IMPORT (loads mocked version of taskRoutes) ===
const { default: taskRoutes } = await import('./taskRoutes.ts')
```

Top-level `await` is valid here because the file is an ESM module (`"type": "module"` in `server/package.json` and NodeNext moduleResolution).

### File Structure After This Story

```
server/
├── routes/
│   ├── root.ts                    ← EXISTING — do not touch
│   ├── taskRoutes.ts              ← EXISTING (Story 2.3) — do not touch
│   ├── taskRoutes.test.ts         ← NEW (this story)
│   └── schemas/
│       └── taskSchemas.ts         ← EXISTING (Story 2.3) — do not touch
```

### `@fastify/sensible` Provides 4xx Helpers

`reply.notFound()` and `reply.badRequest()` are `@fastify/sensible` helpers — they produce `HttpError` objects that the `errorHandler.ts` processes into `{ statusCode, error, message }`. Both plugins must be registered in the test app or these helpers will be undefined and throw.

### Project Structure Notes

- No `src/` subdirectory in `server/` — this is a confirmed flat layout established in Story 2.1 dev notes
- Co-location convention: test file lives at `server/routes/taskRoutes.test.ts`, NOT in a `server/test/` folder (which was deleted per Epic 1 Story 1.3)
- `@shared/types` path alias resolves in both production and test environments via `tsconfig.base.json`

### References

- [Story 2.3 dev notes — autoPrefix, trim guard, sensible helpers, .ts extension rule](_bmad-output/implementation-artifacts/2-3-task-route-handlers-with-json-schema-validation.md)
- [Story 2.1 dev notes — flat server layout, co-location](_bmad-output/implementation-artifacts/2-1-sqlite-schema-and-taskrepository.md)
- [project-context.md — mock boundary rules, NodeNext import extensions](_bmad-output/project-context.md)
- [epics.md — Story 2.4 AC](_bmad-output/planning-artifacts/epics.md)
- [TaskRepository.test.ts — node:test usage patterns](server/repositories/TaskRepository.test.ts)
- [taskRoutes.ts — production file being tested](server/routes/taskRoutes.ts)
- [errorHandler.ts — error shape contract](server/plugins/errorHandler.ts)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- `mock.module` requires `--experimental-test-module-mocks` flag in Node.js v24 — updated `server/package.json` test scripts to include it
- `mock.fn` generic params must be function types (`() => T`), not tuple types (`[args], ReturnType`) — corrected in test file
- `tsconfig.test.json` `include` array extended with `types/**/*.d.ts` so the `FastifyInstance.db` augmentation is visible during test type-checking
- 8 test cases written (GET, POST valid, POST empty, POST whitespace, PATCH found, PATCH not-found, DELETE, 500 error shape) — all 21 server tests pass in ~330ms with no file I/O

### File List

- server/routes/taskRoutes.test.ts (new)
- server/package.json (updated test scripts: added `--experimental-test-module-mocks` flag)
- server/tsconfig.test.json (updated include: added `types/**/*.d.ts`)
- server/routes/taskRoutes.test.ts (patch #2: `{} as never` → `{} as unknown as Database.Database`; import `Database` type from `better-sqlite3`)

### Review Findings

- [x] [Review][Defer] `noEmit: true` in `server/tsconfig.json` means `npm run build` emits nothing — root cause is `.ts` import extensions requiring `allowImportingTsExtensions`; Node.js v24 runs TS natively so dev/test work, but compiled production build needs a non-tsc toolchain; deferred pending deployment strategy decision [server/tsconfig.json] — deferred, pre-existing architectural constraint
- [x] [Review][Defer] `--experimental-test-module-mocks` is subject to Node.js API changes [server/package.json] — deferred, pre-existing
- [x] [Review][Patch] `{} as never` type cast replaced with `{} as unknown as Database.Database` for precise test intent [taskRoutes.test.ts:45] — fixed
