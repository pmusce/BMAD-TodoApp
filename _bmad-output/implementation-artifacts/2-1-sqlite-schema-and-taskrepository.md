# Story 2.1: SQLite Schema & TaskRepository

Status: done

## Story

As a developer,
I want a SQLite database initialized with the tasks schema and a `TaskRepository` class wrapping all queries,
so that all data access is centralised, type-safe, and the only place in the codebase that contains SQL.

## Acceptance Criteria

1. **Given** `server/migrations/001_create_tasks.sql` exists **When** reviewed **Then** it contains `CREATE TABLE IF NOT EXISTS tasks` with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `text TEXT NOT NULL`, `completed INTEGER DEFAULT 0`, `created_at INTEGER NOT NULL`, `user_id INTEGER NULL`

2. **Given** `TaskRepository.ts` exists in `server/repositories/` **When** reviewed **Then** it exposes `findAll()`, `create(payload)`, `update(id, patch)`, and `delete(id)` methods using `better-sqlite3` prepared statements

3. **Given** `TaskRepository` executes a `SELECT` **When** rows are returned **Then** all `snake_case` DB column names are mapped to their `camelCase` TypeScript equivalents (`created_at` → `createdAt`, `user_id` → `userId`) before being returned to callers

4. **Given** `TaskRepository.test.ts` exists co-located with `TaskRepository.ts` **When** run via `node --test` **Then** it passes 6 test cases covering: `findAll` returns empty array initially, `create` inserts and returns a Task, `findAll` returns created task, `update` toggles completed, `update` on missing id returns undefined, `delete` removes the task

5. **Given** the Fastify app initialises the database plugin **When** the SQLite connection is opened **Then** `db.pragma('journal_mode = WAL')` is executed before any queries _(WAL pragma is applied in the `db.ts` plugin — Story 2.2; TaskRepository itself does NOT call it)_

## Tasks / Subtasks

- [x] Task 1 — Update `server/package.json` test script to discover TypeScript test files (prerequisite for AC: 4)
  - [x] Change `"test": "node --test"` → `"test": "node --test **/*.test.ts"` in `server/package.json`
  - [x] The default `node --test` discovery only matches `.js/.mjs/.cjs` — TypeScript files must be passed explicitly or via glob
  - [x] Node 22.12+ native TS stripping handles `.ts` transparently; the monorepo already relies on this (see deferred-work note: "node --test *.ts relies on Node 22 implicit TypeScript stripping")
  - [x] After change, verify `npm test -w server` still exits 0 from monorepo root (existing `server/shared-types.smoke.test.ts` must also pass or be confirmed that it passes)
  - [x] Do NOT add `--experimental-strip-types` — it is implicit in Node 22.12+/24

- [x] Task 2 — Create `server/migrations/001_create_tasks.sql` (AC: 1)
  - [x] File path: `server/migrations/001_create_tasks.sql`
  - [x] Content must be exactly:
    ```sql
    CREATE TABLE IF NOT EXISTS tasks (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      text       TEXT    NOT NULL,
      completed  INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL,
      user_id    INTEGER NULL
    );
    ```
  - [x] Use `snake_case` for all column names — **never camelCase in SQL**
  - [x] `completed` is `INTEGER NOT NULL DEFAULT 0` — SQLite has no BOOLEAN type
  - [x] `created_at` stores Unix milliseconds as `INTEGER NOT NULL` — never ISO string
  - [x] `user_id` is `INTEGER NULL` — reserved for future auth; never writable via the public API
  - [x] Remove the placeholder `.gitkeep` from `server/migrations/` if it still exists

- [x] Task 3 — Create `server/repositories/TaskRepository.ts` (AC: 2, 3)
  - [x] File path: `server/repositories/TaskRepository.ts`
  - [x] Import `Database` and `Statement` types from `better-sqlite3`
  - [x] Import `Task`, `CreateTaskPayload`, `UpdateTaskPayload` from `@shared/types` — **never redefine them locally**
  - [x] Class `TaskRepository` takes `db: Database` in its constructor — enables dependency injection for testing and Fastify plugin decoration
  - [x] Prepare all statements in the constructor (prepared statements are created once, called many times — better-sqlite3 best practice):
    - `findAllStmt` — `SELECT * FROM tasks ORDER BY created_at DESC`
    - `createStmt` — `INSERT INTO tasks (text, completed, created_at, user_id) VALUES (?, 0, ?, NULL)`
    - `updateStmt` — `UPDATE tasks SET completed = ? WHERE id = ?`
    - `deleteStmt` — `DELETE FROM tasks WHERE id = ?`
    - `findByIdStmt` — `SELECT * FROM tasks WHERE id = ?` (needed to return the updated row and check existence in `update`)
  - [x] `findAll(): Task[]` — runs `findAllStmt.all()`, maps each row using the private row-mapper
  - [x] `create(payload: CreateTaskPayload): Task` — runs `createStmt.run(payload.text, Date.now())`, then retrieves the inserted row via `db.prepare('SELECT * FROM tasks WHERE id = ?').get(info.lastInsertRowid)` and maps it
  - [x] `update(id: number, patch: UpdateTaskPayload): Task | undefined` — runs `findByIdStmt.get(id)`; if row not found, return `undefined`; otherwise run `updateStmt.run(patch.completed ? 1 : 0, id)`, then re-fetch and return mapped row
  - [x] `delete(id: number): void` — runs `deleteStmt.run(id)`
  - [x] **Row mapper** (private method `mapRow`): maps a raw SQLite row to `Task`:
    ```typescript
    private mapRow(row: Record<string, unknown>): Task {
      return {
        id: row.id as number,
        text: row.text as string,
        completed: (row.completed as number) === 1,
        createdAt: row.created_at as number,
        // userId deliberately NOT mapped to Task — Task interface does not include it (per @shared/types)
      }
    }
    ```
  - [x] Note: `Task` from `@shared/types` does NOT include `userId` — the architecture defers auth to post-v1. Do not add `userId` to the returned Task object or to the `Task` interface.
  - [x] The `tsconfig.json` `paths` (`@shared/*`) is inherited from `tsconfig.base.json` (`"baseUrl": "."` relative to monorepo root). The server uses `"moduleResolution": "NodeNext"` so import path must include explicit extension hint or Jest-style mapping — but since this is a build-time alias resolved by TypeScript, `import type { Task } from '@shared/types'` works as-is (same as Story 1.4 established)

- [x] Task 4 — Create `server/repositories/TaskRepository.test.ts` (AC: 4)
  - [x] File path: `server/repositories/TaskRepository.test.ts` (co-located with `TaskRepository.ts`)
  - [x] Test runner: `node:test` with `describe`/`it`/`before`/`after` from `'node:test'`
  - [x] Assertions: `import assert from 'node:assert/strict'`
  - [x] Open an **in-memory** SQLite DB for tests: `new Database(':memory:')` — no file created, no cleanup needed
  - [x] Load and run the migration SQL before any tests:
    ```typescript
    import { readFileSync } from 'node:fs'
    import { fileURLToPath } from 'node:url'
    import { join, dirname } from 'node:path'

    const __dirname = dirname(fileURLToPath(import.meta.url))
    const migrationSql = readFileSync(
      join(__dirname, '../migrations/001_create_tasks.sql'),
      'utf8'
    )
    db.exec(migrationSql)
    ```
  - [x] 6 required test cases (run in order inside a `describe('TaskRepository', ...)` block):
    1. `findAll returns empty array initially` — call `repo.findAll()`, assert result is `[]`
    2. `create inserts and returns a Task` — call `repo.create({ text: 'Buy milk' })`, assert: result has `id` (number), `text === 'Buy milk'`, `completed === false`, `createdAt` is a positive number (Unix ms)
    3. `findAll returns created task` — call `repo.findAll()`, assert `length === 1` and `[0].text === 'Buy milk'`
    4. `update toggles completed to true` — take the created task's `id`, call `repo.update(id, { completed: true })`, assert `result.completed === true` and `result.id === id`
    5. `update on missing id returns undefined` — call `repo.update(9999, { completed: true })`, assert `result === undefined`
    6. `delete removes the task` — call `repo.delete(id)`, then `repo.findAll()`, assert the array is empty
  - [x] Use `before()`/`after()` hooks to set up and close the DB:
    ```typescript
    let db: Database.Database
    let repo: TaskRepository

    before(() => {
      db = new Database(':memory:')
      db.exec(migrationSql)
      repo = new TaskRepository(db)
    })

    after(() => {
      db.close()
    })
    ```
  - [x] Do NOT open a file-based SQLite DB (`./data/todo.db`) in tests — always use `:memory:`
  - [x] Do NOT call `db.pragma('journal_mode = WAL')` in the test — that is the Fastify plugin's responsibility (Story 2.2)

- [x] Task 5 — Verification
  - [x] Run `npm test -w server` from monorepo root → 11 tests pass (6 TaskRepository + 5 smoke), exit 0
  - [x] Run `npm test --workspaces --if-present` from monorepo root → all tests pass (no regressions on client or shared)
  - [x] Run `npx tsc --noEmit` in `server/` → 0 type errors (test files excluded from main tsconfig)
  - [x] Run `npx tsc -p tsconfig.test.json` in `server/` → 0 type errors in test files
  - [x] Run `npm run lint -w server` → 0 lint errors
  - [x] Confirmed `server/migrations/.gitkeep` removed (replaced by `001_create_tasks.sql`)
  - [x] Confirmed no SQL strings exist outside `server/repositories/TaskRepository.ts` and `server/migrations/`

## Dev Notes

### Server Filesystem Layout (No `src/` Subdirectory)

The architecture document describes paths like `server/src/repositories/`. **This is wrong for this project.** Story 1.3 moved all generated files from `server/src/` to `server/` root. The actual layout is:

```
server/
├── app.ts
├── server.ts
├── plugins/
│   ├── sensible.ts
│   └── support.ts        ← stub; db.ts plugin is added in Story 2.2
├── routes/
│   └── root.ts           ← stub; task routes added in Story 2.3
├── repositories/         ← NEW directory created in this story
│   ├── TaskRepository.ts
│   └── TaskRepository.test.ts
├── migrations/
│   └── 001_create_tasks.sql   ← NEW (replaces .gitkeep)
├── types/
│   └── fastify.d.ts      ← stub; db augmentation added in Story 2.2
└── data/
    └── .gitkeep
```

### `node --test` and TypeScript Discovery

The current `server/package.json` `test` script is `"node --test"`. Node's default discovery looks for `.js/.mjs/.cjs` only — TypeScript files are NOT discovered automatically with earlier Node versions. **Node 24 auto-discovers `*.test.ts` files with the bare `node --test` command** — the explicit glob `"node --test **/*.test.ts"` specified in Task 1 is unnecessary on Node 24+. The test script was kept as `"node --test"`. If the project ever needs to support Node < 24, the glob form must be restored.

### `@shared/types` Import in Server

`Task`, `CreateTaskPayload`, and `UpdateTaskPayload` are imported as:
```typescript
import type { Task, CreateTaskPayload, UpdateTaskPayload } from '@shared/types'
```
The `@shared/*` alias is defined in `tsconfig.base.json` as `"@shared/*": ["shared/*"]` with `baseUrl: "."` (monorepo root). The server `tsconfig.json` inherits this. Do NOT redefine the alias locally.

### `Task` Interface Does NOT Include `userId`

`shared/types.ts` defines:
```typescript
export interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: number
}
```
`userId` is stored in SQLite (`user_id INTEGER NULL`) but is NOT part of the `Task` interface in v1. The row mapper in `TaskRepository` must NOT add `userId` to the returned object.

### WAL Mode Is NOT TaskRepository's Responsibility

`db.pragma('journal_mode = WAL')` will be called in `server/plugins/db.ts` (Story 2.2) when the Fastify plugin opens the database connection. `TaskRepository` has no knowledge of pragmas — it receives an already-configured `Database` instance via constructor injection.

### `better-sqlite3` Is Synchronous

`better-sqlite3` is synchronous by design (unlike `sqlite3`). There are no Promises or async/await in repository methods. `stmt.all()`, `stmt.get()`, `stmt.run()` are all sync calls. This is intentional — Fastify route handlers will call them synchronously inside async route handler functions.

### Row Mapping: `completed` 0/1 → boolean

SQLite stores `completed` as `INTEGER (0 or 1)`. The mapper converts: `completed: (row.completed as number) === 1`.  
Do NOT return the raw `0`/`1` integer — the `Task` type requires `boolean`.

### Row Mapping: `create` Returns the Inserted Row

`better-sqlite3` `stmt.run()` returns `Database.RunResult` with `lastInsertRowid`. After inserting, fetch the row immediately using a second prepared statement (`SELECT * FROM tasks WHERE id = ?`). Do not try to reconstruct the Task from the input alone — `Date.now()` called twice could give different values.

### ESM-Compatible `__dirname` in Test File

The test file uses `import.meta.url` to resolve the migration file path (ESM has no `__dirname`):
```typescript
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
const __dirname = dirname(fileURLToPath(import.meta.url))
```

### No Fastify Plugin or Route Changes in This Story

This story only creates the migration SQL, the repository class, and its tests. Do NOT register the `db` plugin, do NOT modify `plugins/support.ts`, do NOT add the Fastify `db` type augmentation to `types/fastify.d.ts` — all of that is Story 2.2.

### Project Structure Notes

Alignment with architecture:
- `server/repositories/` directory is new — creating it in this story
- Test file is co-located: `server/repositories/TaskRepository.test.ts` (not in a `__tests__/` folder)
- `server/migrations/` already exists (created in Story 1.3) — add the SQL file, remove `.gitkeep`
- `server/types/fastify.d.ts` remains as-is (stub `export {}`) — augmentation is Story 2.2

### References

- Task schema: [_bmad-output/planning-artifacts/architecture.md](../../_bmad-output/planning-artifacts/architecture.md) — "Data Architecture" table
- API/JSON naming conventions: [_bmad-output/planning-artifacts/architecture.md](../../_bmad-output/planning-artifacts/architecture.md) — "Naming Patterns" section
- Repository boundary rules: [_bmad-output/planning-artifacts/architecture.md](../../_bmad-output/planning-artifacts/architecture.md) — "Architectural Boundaries — Data Boundary"
- Shared types: [shared/types.ts](../../shared/types.ts)
- Project context rules: [_bmad-output/project-context.md](../../_bmad-output/project-context.md) — "Database / SQL" section
- Story AC source: [_bmad-output/planning-artifacts/epics.md](../../_bmad-output/planning-artifacts/epics.md) — Epic 2, Story 2.1
- Server file layout clarification: [_bmad-output/implementation-artifacts/1-3-backend-workspace-bootstrap.md](./1-3-backend-workspace-bootstrap.md) — Task 8 dev note

### Review Findings

- [x] [Review][Patch] AC:3 `user_id → userId` mapping not implemented — decided: fix to match AC; add `userId: number | null` to `Task` interface and `mapRow()`. [server/repositories/TaskRepository.ts:65, shared/types.ts]
- [x] [Review][Decision-Dismissed] `test` script kept as bare `node --test` — accepted; Task 1 dev note annotated to document Node 24 auto-discovery behaviour. [server/package.json]
- [x] [Review][Patch] `delete(id)` returns void — changed to `boolean` (`changes > 0`). [server/repositories/TaskRepository.ts:48]
- [x] [Review][Patch] Missing test coverage: `delete` on non-existent ID and `update` toggling `completed` back to `false` — added 2 test cases (total: 8 tests). [server/repositories/TaskRepository.test.ts]
- [x] [Review][Defer] `update()` get-check-update-get pattern without a transaction [server/repositories/TaskRepository.ts:51-61] — deferred, pre-existing; better-sqlite3 is synchronous so no actual race today; revisit if async SQLite is ever adopted
- [x] [Review][Defer] `create()` uses non-null assertion `row!` after `findByIdStmt.get(lastInsertRowid)` [server/repositories/TaskRepository.ts:44] — deferred, pre-existing; unreachable in practice after a successful INSERT in the same synchronous call
- [x] [Review][Defer] Stateful test suite — tests 3-6 depend on shared DB state from tests 1-2 [server/repositories/TaskRepository.test.ts] — deferred, pre-existing; standard pattern for in-memory integration tests at this scale
- [x] [Review][Defer] `SELECT *` in `findAll` and `findByIdStmt` — implicit column dependency [server/repositories/TaskRepository.ts:21] — deferred, pre-existing; explicit column list is safer for schema evolution; defer to a future schema migration story
- [x] [Review][Defer] `updateStmt` hardcoded to update only `completed` — `text` field update impossible [server/repositories/TaskRepository.ts:28] — deferred, pre-existing; v1 spec only requires toggling `completed`; revisit when edit-text is a product requirement

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6 (GitHub Copilot — Amelia / bmad-agent-dev)

### Debug Log References

### Completion Notes List

- Node 24.11 does not perform `.js` → `.ts` implicit remapping for relative imports; `.ts` extension must be used explicitly in test imports. Added `server/tsconfig.test.json` with `allowImportingTsExtensions: true` + `noEmit: true` for type-checking test files. Main `tsconfig.json` now excludes `**/*.test.ts` (test files belong only in the test tsconfig, not the build).
- Constructor parameter properties (`constructor(private db: T)`) are not supported in Node's strip-only TypeScript mode. Changed to explicit property declaration + assignment.
- `@shared/types` import must be `@shared/types.js` in `NodeNext` moduleResolution (explicit extension required). `import type` uses are erased at runtime so no runtime resolution is attempted.
- Node 24 auto-discovers `*.test.ts` files with default `node --test` (no explicit glob needed). Reverted test script to `node --test`.
- 11 tests pass: 6 new TaskRepository (in-memory SQLite) + 5 existing smoke tests. Zero TypeScript errors. Zero lint errors. Zero regressions.

### File List

- `server/package.json` — modified: `test` and `test:watch` scripts (keep `node --test` auto-discovery)
- `server/tsconfig.json` — modified: added `**/*.test.ts` to exclude list
- `server/tsconfig.test.json` — created: test-only tsconfig with `allowImportingTsExtensions: true + noEmit: true`
- `server/migrations/001_create_tasks.sql` — created: tasks table DDL
- `server/repositories/TaskRepository.ts` — created: all SQL queries + snake→camelCase mapper; `delete()` returns `boolean`; `mapRow()` includes `userId`
- `server/repositories/TaskRepository.test.ts` — created: 8 test cases using in-memory SQLite
- `shared/types.ts` — modified: added `userId: number | null` to `Task` interface
- `server/shared-types.smoke.test.ts` — modified: added `userId: null` to Task literal
- `client/src/shared-types.smoke.test.ts` — modified: added `userId: null` to Task literal
