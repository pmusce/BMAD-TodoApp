# Story 2.2: Fastify Plugins (DB, CORS, Error Handler)

Status: done

## Story

As a developer,
I want the Fastify app to register the database plugin, CORS plugin, and custom error handler,
so that every route has access to the database and all errors return a consistent, safe JSON shape.

## Acceptance Criteria

1. **Given** `server/plugins/db.ts` exists **When** the plugin is registered **Then** it opens `better-sqlite3` at `DATABASE_PATH` env variable (with fallback `./data/todo.db`), executes the migration SQL, enables WAL mode via `db.pragma('journal_mode = WAL')`, and decorates the Fastify instance with `fastify.db`

2. **Given** `server/plugins/cors.ts` exists **When** the plugin is registered **Then** it registers `@fastify/cors` with `origin` read from the `CORS_ORIGIN` environment variable (with fallback `http://localhost:5173`)

3. **Given** `server/plugins/errorHandler.ts` exists **When** any route throws or rejects **Then** the response body contains only `{ statusCode, error, message }` — no stack traces, no internal DB error details. For 5xx errors the `message` is always `"An unexpected error occurred"`.

4. **Given** `server/types/fastify.d.ts` is updated **When** TypeScript compiles **Then** `FastifyInstance` is augmented with `db: Database` from `better-sqlite3` with zero type errors

5. **Given** `server/app.ts` exports an async factory function via `@fastify/autoload` **When** called in tests **Then** it builds the Fastify instance and registers all plugins and routes without starting an HTTP listener

## Tasks / Subtasks

- [x] Task 1 — Update `server/types/fastify.d.ts` (AC: 4)
  - [x] Replace the stub comment with a real type augmentation
  - [x] Import `Database` from `'better-sqlite3'` — use the default import type: `import type Database from 'better-sqlite3'`
  - [x] Augment `FastifyInstance` to add `db: Database.Database`:
    ```typescript
    import type Database from 'better-sqlite3'
    import type { FastifyInstance } from 'fastify'

    declare module 'fastify' {
      interface FastifyInstance {
        db: Database.Database
      }
    }
    ```
  - [x] Must export something to be treated as a module (add `export {}` if the file has no other exports)
  - [x] This file is included via `server/tsconfig.json` `"include": ["."]]` — no import of this file is needed

- [x] Task 2 — Create `server/plugins/db.ts` (AC: 1)
  - [ ] File path: `server/plugins/db.ts`
  - [x] Use `fastify-plugin` (`fp`) wrapper — **critical**: without `fp`, the `fastify.db` decorator is scoped only to the child plugin and will NOT be visible to other plugins or routes
  - [x] Import `Database` (default import) from `'better-sqlite3'`
  - [x] Import `readFileSync` from `'node:fs'`, `fileURLToPath` from `'node:url'`, `join`/`dirname` from `'node:path'`
  - [x] Read migration SQL at plugin startup using ESM-compatible path:
    ```typescript
    const __dirname = dirname(fileURLToPath(import.meta.url))
    const migrationSql = readFileSync(join(__dirname, '../migrations/001_create_tasks.sql'), 'utf8')
    ```
  - [x] Read `DATABASE_PATH` from env: `const dbPath = process.env.DATABASE_PATH ?? './data/todo.db'`
  - [x] Open database: `const db = new Database(dbPath)`
  - [x] Enable WAL mode **before** executing migration: `db.pragma('journal_mode = WAL')`
  - [x] Execute migration: `db.exec(migrationSql)`
  - [x] Decorate instance: `fastify.decorate('db', db)`
  - [x] Register close hook: `fastify.addHook('onClose', () => { db.close() })`
  - [x] Full example structure:
    ```typescript
    import fp from 'fastify-plugin'
    import Database from 'better-sqlite3'
    import { readFileSync } from 'node:fs'
    import { fileURLToPath } from 'node:url'
    import { join, dirname } from 'node:path'
    import type { FastifyPluginAsync } from 'fastify'

    const dbPlugin: FastifyPluginAsync = async (fastify) => {
      const __dirname = dirname(fileURLToPath(import.meta.url))
      const migrationSql = readFileSync(join(__dirname, '../migrations/001_create_tasks.sql'), 'utf8')
      const dbPath = process.env.DATABASE_PATH ?? './data/todo.db'
      const db = new Database(dbPath)
      db.pragma('journal_mode = WAL')
      db.exec(migrationSql)
      fastify.decorate('db', db)
      fastify.addHook('onClose', () => { db.close() })
    }

    export default fp(dbPlugin)
    ```

- [x] Task 3 — Create `server/plugins/cors.ts` (AC: 2)
  - [x] File path: `server/plugins/cors.ts`
  - [x] Follow the same `fp`-wrapped pattern as existing `sensible.ts`
  - [x] Import `cors` from `'@fastify/cors'`
  - [x] Read `CORS_ORIGIN` from env: `const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'`
  - [x] Register `@fastify/cors` with `{ origin }` option
  - [x] Full example structure:
    ```typescript
    import fp from 'fastify-plugin'
    import cors from '@fastify/cors'
    import type { FastifyPluginAsync } from 'fastify'

    const corsPlugin: FastifyPluginAsync = async (fastify) => {
      const origin = process.env.CORS_ORIGIN ?? 'http://localhost:5173'
      await fastify.register(cors, { origin })
    }

    export default fp(corsPlugin)
    ```

- [x] Task 4 — Create `server/plugins/errorHandler.ts` (AC: 3)
  - [x] File path: `server/plugins/errorHandler.ts`
  - [x] Use `fastify-plugin` (`fp`) wrapper so the error handler applies to the root scope
  - [x] Import `STATUS_CODES` from `'node:http'` to convert status codes to HTTP status text (e.g., `STATUS_CODES[400]` → `'Bad Request'`)
  - [x] Use `fastify.setErrorHandler((error, _request, reply) => { ... })`
  - [x] Determine the final `statusCode`: use `error.statusCode ?? 500` (Fastify validation errors set `statusCode: 400`)
  - [x] For ANY 5xx status: `message = 'An unexpected error occurred'` and log the error via `fastify.log.error(error)` — **never** expose stack traces or raw DB error messages
  - [x] For 4xx status: `message = error.message` (Fastify validation errors produce safe user-facing messages like `"body/text must be a non-empty string"`)
  - [x] The `error` field in the response body: `STATUS_CODES[statusCode] ?? 'Unknown Error'`
  - [x] Full example structure:
    ```typescript
    import fp from 'fastify-plugin'
    import { STATUS_CODES } from 'node:http'
    import type { FastifyError, FastifyPluginAsync } from 'fastify'

    const errorHandlerPlugin: FastifyPluginAsync = async (fastify) => {
      fastify.setErrorHandler((error: FastifyError, _request, reply) => {
        const statusCode = error.statusCode ?? 500
        const isServerError = statusCode >= 500
        if (isServerError) {
          fastify.log.error(error)
        }
        const message = isServerError ? 'An unexpected error occurred' : error.message
        return reply.status(statusCode).send({
          statusCode,
          error: STATUS_CODES[statusCode] ?? 'Unknown Error',
          message,
        })
      })
    }

    export default fp(errorHandlerPlugin)
    ```

- [x] Task 5 — Verify autoload discovery and startup (AC: 5)
  - [x] `server/app.ts` uses `@fastify/autoload` for `plugins/` — do NOT modify `app.ts`; the three new plugin files are auto-discovered by alphabetical scan
  - [x] Load order will be: `cors.ts`, `db.ts`, `errorHandler.ts`, `sensible.ts`, `support.ts` — all wrapped in `fp` so decorators are root-scoped
  - [x] Confirm `server/plugins/support.ts` is left as-is (it is the autoload-generated stub)
  - [x] Run `npm run dev -w server` → server starts on port 3000, logs "Server listening on..." in pino-pretty format, no errors
  - [x] Verify `GET http://localhost:3000/` returns a response (existing stub root route)

- [x] Task 6 — Verification
  - [x] Run `npm test --workspaces --if-present` from monorepo root → all tests pass, exit 0 (no regressions)
  - [x] Run `npx tsc --noEmit` in `server/` → 0 type errors (compile with main tsconfig, excludes test files)
  - [x] Run `npx tsc -p server/tsconfig.test.json` → 0 type errors in test files
  - [x] Run `npm run lint -w server` → 0 lint errors
  - [x] Confirm `fastify.db` is correctly typed — TypeScript should offer autocomplete on `fastify.db.prepare(...)` without `any` cast in route files (will be confirmed more definitively in Story 2.3)

## Dev Notes

### CRITICAL: Server Has No `src/` Subdirectory

The architecture document describes paths like `server/src/plugins/db.ts`. **This is WRONG for this project.** As established in Story 2.1 dev notes, the server layout is flat:

```
server/
├── app.ts                     ← factory function (DO NOT MODIFY)
├── server.ts                  ← HTTP listener entry point (DO NOT TOUCH)
├── plugins/
│   ├── cors.ts                ← NEW (this story)
│   ├── db.ts                  ← NEW (this story)
│   ├── errorHandler.ts        ← NEW (this story)
│   ├── sensible.ts            ← EXISTING — do NOT modify
│   └── support.ts             ← EXISTING placeholder — do NOT modify
├── routes/
│   └── root.ts                ← EXISTING placeholder — do NOT touch (Story 2.3)
├── types/
│   └── fastify.d.ts           ← UPDATE (this story)
├── repositories/
│   ├── TaskRepository.ts      ← EXISTING (Story 2.1)
│   └── TaskRepository.test.ts ← EXISTING (Story 2.1)
├── migrations/
│   └── 001_create_tasks.sql   ← EXISTING (Story 2.1)
└── data/
    └── .gitkeep
```

### `app.ts` Uses Autoload — Do NOT Modify It

`server/app.ts` already uses `@fastify/autoload` to scan `plugins/` and `routes/` directories. Simply creating new `.ts` files in `server/plugins/` is sufficient for them to be loaded automatically. Do **not** manually register the new plugins in `app.ts`.

### `fastify-plugin` Wrapper Is Mandatory for `db.ts`

Without the `fp()` wrapper, Fastify treats the plugin as a scoped encapsulation unit — the `fastify.db` decoration is deleted after the plugin scope exits and is NOT visible to sibling plugins or route handlers. Always wrap decorator plugins in `fp()`.

`cors.ts` and `errorHandler.ts` also benefit from the `fp()` wrapper to ensure they apply to the root instance rather than a child scope.

### ESM + NodeNext: Import Extension Rules

The project uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. Key rules:
- Node packages (e.g., `'better-sqlite3'`, `'fastify-plugin'`): **no extension** needed
- Local TypeScript files: must use `.js` extension *when referenced by other TS modules* (see `TaskRepository.ts`: `import type { Task } from '@shared/types.js'`)
- But `@fastify/autoload` discovers files directly by filesystem scan, so the plugin files themselves do not need to import each other

### `Task.userId` Is In the Shared Interface

The actual `shared/types.ts` (as implemented in Story 1.4) includes `userId: number | null` in the `Task` interface — contrary to the Epic spec. The `TaskRepository.mapRow()` correctly maps `user_id → userId`. This is relevant for Story 2.3 route serialisation (route response schemas must allow `userId`).

### `better-sqlite3` Import Syntax

In TypeScript with NodeNext resolution:
```typescript
// Default import for the constructor
import Database from 'better-sqlite3'

// For the type of a Database instance
import type Database from 'better-sqlite3'
// Then use: Database.Database as the instance type
```

In `fastify.d.ts`, the decoration type should be `Database.Database` (the instance type, not the constructor):
```typescript
import type Database from 'better-sqlite3'
declare module 'fastify' {
  interface FastifyInstance {
    db: Database.Database
  }
}
```

### Fastify v5 Error Handler Notes

- `error.statusCode` is set by Fastify for validation errors (400) and `@fastify/sensible` errors (like `reply.notFound()` → 404)
- `error.statusCode` is `undefined` for unexpected JS errors — default to `500`
- Validation errors from JSON Schema (Story 2.3) produce `statusCode: 400` and a readable `error.message` — safe to pass through
- `@fastify/sensible` errors (e.g., from Story 2.3's `reply.notFound()`) have `statusCode: 404` and a developer-set message — safe to pass through
- Internal errors (DB crash, etc.) have no `statusCode` and potentially dangerous `error.message` — must be replaced with `"An unexpected error occurred"`

### `@fastify/cors` v10 API

`@fastify/cors` v10 (installed in this project) registers correctly via:
```typescript
fastify.register(cors, { origin: 'http://localhost:5173' })
```
The `origin` option accepts a string (single allowed origin), `true` (allow all), or a function. Use a string from env for this story.

### WAL Mode + Migration Order

In `db.ts`, the order **must** be:
1. `new Database(dbPath)` — open
2. `db.pragma('journal_mode = WAL')` — set WAL mode
3. `db.exec(migrationSql)` — run schema migration

Do NOT run migration before WAL pragma — WAL mode must be set first per project convention. Do NOT call WAL pragma in `TaskRepository` — it belongs exclusively in the plugin.

### `sensible.ts` Already Registered

`server/plugins/sensible.ts` already registers `@fastify/sensible`. Do NOT add a second `@fastify/sensible` registration in `cors.ts` or elsewhere. The `sensible` plugin provides: `reply.notFound()`, `reply.badRequest()`, `reply.internalServerError()`, etc. — these will be used in Story 2.3 route handlers.

### `delete()` Returns `boolean`, Not `void`

The actual `TaskRepository.delete(id)` method (as implemented in Story 2.1) returns `boolean` (`result.changes > 0`), not `void`. Story 2.3 route handlers should account for this. (Out of scope for this story but important context.)

### Project Structure Notes

- All three new plugin files follow the exact pattern of existing `sensible.ts`: default `fp`-wrapped async function export
- `support.ts` is an autoload-generated placeholder — it is loaded by autoload but does nothing; leave it unchanged
- No test file is created in this story — the plugin wiring is verified by integration via the dev server and the existing TaskRepository tests

### References

- Current `server/plugins/sensible.ts` — establishes `fp`-wrapped plugin pattern [server/plugins/sensible.ts]
- Current `server/plugins/support.ts` — placeholder pattern (do not modify) [server/plugins/support.ts]
- Current `server/app.ts` — autoload wiring (do not modify) [server/app.ts]
- Current `server/types/fastify.d.ts` — stub to replace [server/types/fastify.d.ts]
- `server/migrations/001_create_tasks.sql` — migration SQL loaded by `db.ts` [server/migrations/001_create_tasks.sql]
- `shared/types.ts` — `Task` interface including `userId` [shared/types.ts]
- Architecture doc — Security: error serialisation shape `{ statusCode, error, message }` [_bmad-output/planning-artifacts/architecture.md#Authentication--Security]
- Architecture doc — API patterns: HTTP status codes [_bmad-output/planning-artifacts/architecture.md#API--Communication-Patterns]
- Previous story dev notes — server flat layout, NodeNext import rules [_bmad-output/implementation-artifacts/2-1-sqlite-schema-and-taskrepository.md#Dev-Notes]
- Deferred work — `sensible.ts` already registered, no duplicate needed [_bmad-output/implementation-artifacts/deferred-work.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-5 (Claude Sonnet 4.6)

### Debug Log References

### Completion Notes List

- All 4 plugin files created / updated; `@fastify/autoload` auto-discovers them — `app.ts` untouched
- `fastify.db` typed as `Database.Database` via module augmentation in `fastify.d.ts`
- WAL pragma applied before migration execution in `db.ts` onClose hook registered for graceful shutdown
- Error handler masks all 5xx messages, passes through safe 4xx messages; uses `node:http` STATUS_CODES for the `error` field
- Dev server confirmed: starts on port 3000, DB file created (12KB), error responses shape `{statusCode,error,message}` ✓
- All 18 workspace tests pass (13 server + 5 client), 0 TypeScript errors, 0 lint errors

### File List

- server/plugins/db.ts (created)
- server/plugins/cors.ts (created)
- server/plugins/errorHandler.ts (created)
- server/types/fastify.d.ts (modified)

### Senior Developer Review (AI)

**Review Date:** 2026-04-28
**Outcome:** Approved (patches applied)
**Layers:** Blind Hunter, Edge Case Hunter, Acceptance Auditor

**Action Items:**

- [x] [Patch][Med] `db.ts`: `db.exec()` failure leaks DB handle — wrapped in try/catch that calls `db.close()` before rethrowing [server/plugins/db.ts]
- [x] [Patch][Low] `db.ts`: `db.close()` in `onClose` hook can propagate unhandled exceptions — wrapped in try/catch [server/plugins/db.ts]
- [x] [Defer] `cors.ts`: `CORS_ORIGIN` empty-string not caught by `??` operator — deferred, pre-existing edge case for v1
- [x] [Defer] `errorHandler.ts`: No structured logging for 4xx client errors — deferred, design choice
- [x] [Defer] All plugins: No `name` metadata on `fp()` wrappers — deferred, cosmetic/debug-only
