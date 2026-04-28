# Story 2.3: Task Route Handlers with JSON Schema Validation

Status: done

## Story

As a developer,
I want four task route handlers registered at `/api/tasks` with JSON Schema validation on all inputs,
so that the API enforces valid payloads at the boundary and returns appropriate HTTP status codes.

## Acceptance Criteria

1. **Given** `GET /api/tasks` is called **When** the database contains tasks **Then** the response is `200` with a JSON array of `Task` objects in `camelCase`

2. **Given** `POST /api/tasks` is called with `{ "text": "Buy milk" }` **When** the text is non-empty **Then** the response is `201` with the created `Task` object

3. **Given** `PATCH /api/tasks/:id` is called with a valid id and `{ "completed": true }` **When** the task exists **Then** the response is `200` with the updated `Task` object

4. **Given** `PATCH /api/tasks/:id` is called with an id that does not exist **When** `TaskRepository.update` returns `undefined` **Then** the response is `404` with `{ "statusCode": 404, "error": "Not Found", "message": "Task <id> not found" }`

5. **Given** `DELETE /api/tasks/:id` is called with a valid id **When** the task exists **Then** the response is `204` with no response body

6. **Given** `POST /api/tasks` is called with `{ "text": "" }` or `{ "text": "   " }` **When** JSON Schema validation runs **Then** the response is `400` with `{ "statusCode": 400, "error": "Bad Request", "message": "..." }`

7. **Given** `server/routes/schemas/taskSchemas.ts` exists **When** reviewed **Then** it defines JSON Schema objects for: POST body (`text` required, non-empty string), PATCH body (`completed` required boolean), route params (`id` required integer) — and `user_id` does NOT appear in any request body schema

## Tasks / Subtasks

- [x] Task 1 — Create `server/routes/schemas/taskSchemas.ts` (AC: 6, 7)
  - [x] Create directory `server/routes/schemas/`
  - [x] Export `createTaskSchema` with `body: { type: 'object', required: ['text'], additionalProperties: false, properties: { text: { type: 'string', minLength: 1 } } }`
  - [x] Export `updateTaskSchema` with `body: { type: 'object', required: ['completed'], additionalProperties: false, properties: { completed: { type: 'boolean' } } }` and `params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } }`
  - [x] Export `taskParamsSchema` with `params: { type: 'object', required: ['id'], properties: { id: { type: 'integer' } } }` (for DELETE)
  - [x] `user_id` must NOT appear in any schema body

- [x] Task 2 — Create `server/routes/taskRoutes.ts` (AC: 1–6)
  - [x] File location: `server/routes/taskRoutes.ts` (co-located with future test)
  - [x] Import `TaskRepository` from `'../repositories/TaskRepository.ts'`
  - [x] Import schemas from `'./schemas/taskSchemas.ts'`
  - [x] Route prefix: `/api/tasks` — uses `export const autoPrefix = '/api/tasks'` for `@fastify/autoload`
  - [x] `GET /` → `200` + `repo.findAll()`
  - [x] `POST /` with `createTaskSchema` → `201` + `repo.create({ text: body.text.trim() })`
  - [x] `PATCH /:id` with `updateTaskSchema` → find by update; if `undefined` → `reply.notFound('Task ${id} not found')`; else `200` + updated task
  - [x] `DELETE /:id` with `taskParamsSchema` → call `repo.delete(id)`; `204` with `reply.code(204).send()`
  - [x] Construct `TaskRepository` from `fastify.db`
  - [x] Params coerced to number by Fastify v5 AJV — `request.params.id` is already a `number`

- [x] Task 3 — Update `server/routes/root.ts` (AC: 1)
  - [x] Removed the placeholder comment
  - [x] autoload handles route discovery — `root.ts` untouched beyond comment removal

- [x] Task 4 — Verify autoload picks up the new route (AC: 1–5)
  - [x] `server/routes/taskRoutes.ts` discovered by `@fastify/autoload` via `autoPrefix = '/api/tasks'`
  - [x] `GET /api/tasks` → `[]` 200 OK ✓
  - [x] `POST /api/tasks` `{ "text": "" }` → 400 ✓
  - [x] `POST /api/tasks` `{ "text": "   " }` → 400 (whitespace guard) ✓
  - [x] `PATCH /api/tasks/1` → 200 updated task ✓
  - [x] `PATCH /api/tasks/9999` → 404 `Task 9999 not found` ✓
  - [x] `DELETE /api/tasks/1` → 204 ✓

- [x] Task 5 — Verification
  - [x] `npm test --workspaces --if-present` → 18/18 pass, exit 0 ✓
  - [x] `npx tsc --noEmit -p server/tsconfig.json` → 0 type errors ✓
  - [x] `npm run lint -w server` → 0 lint errors (pre-existing TS version warning only) ✓

## Dev Notes

### CRITICAL: Server Has No `src/` Subdirectory

The architecture doc references paths like `server/src/routes/taskSchemas.ts` — **this is wrong for this project**. The server layout is flat (established in Story 2.1 and confirmed in Story 2.2):

```
server/
├── app.ts                             ← DO NOT MODIFY (autoload wiring)
├── server.ts                          ← DO NOT TOUCH
├── plugins/
│   ├── cors.ts                        ← EXISTING (Story 2.2) — do not modify
│   ├── db.ts                          ← EXISTING (Story 2.2) — do not modify
│   ├── errorHandler.ts                ← EXISTING (Story 2.2) — do not modify
│   ├── sensible.ts                    ← EXISTING scaffold — do not modify
│   └── support.ts                     ← EXISTING placeholder — do not modify
├── repositories/
│   ├── TaskRepository.ts              ← EXISTING (Story 2.1) — read-only reference
│   └── TaskRepository.test.ts        ← EXISTING (Story 2.1) — do not modify
├── routes/
│   ├── root.ts                        ← UPDATE: remove placeholder comment
│   ├── taskRoutes.ts                  ← NEW (this story)
│   └── schemas/
│       └── taskSchemas.ts             ← NEW (this story)
├── types/
│   └── fastify.d.ts                   ← EXISTING (Story 2.2) — do not modify
├── migrations/
│   └── 001_create_tasks.sql           ← EXISTING (Story 2.1) — do not modify
└── data/
    └── .gitkeep
```

### Route Prefix and Autoload

`server/app.ts` uses `@fastify/autoload` to scan `routes/`. Autoload auto-discovers every `.ts` file recursively and registers them. The route at `server/routes/taskRoutes.ts` should use `{ prefix: '/api/tasks' }` by exporting it via the plugin options:

```typescript
import type { FastifyPluginAsync } from 'fastify'

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  // routes are defined relative to the prefix
  fastify.get('/', ...)
  fastify.post('/', ...)
  fastify.patch('/:id', ...)
  fastify.delete('/:id', ...)
}

export default taskRoutes
export const autoPrefix = '/api/tasks'  // ← @fastify/autoload reads this
```

`autoPrefix` is the `@fastify/autoload` convention for setting a per-file route prefix without modifying `app.ts`.

### Fastify v5 Route Params: Integers

In Fastify v5 with JSON Schema `type: 'integer'` on params, the param value IS coerced to a number by the time it reaches the handler (Fastify's AJV coerces `params` using `coerceTypes: true`). So `request.params.id` will be a `number`, not a string. You can use it directly. Declare the params type in TypeScript:

```typescript
interface TaskParams {
  id: number
}

fastify.patch<{ Params: TaskParams; Body: UpdateTaskPayload }>(
  '/:id',
  { schema: updateTaskSchema },
  async (request, reply) => {
    const { id } = request.params  // already a number
    ...
  }
)
```

However, if TypeScript complains about the schema coercion, you may need `const id = Number(request.params.id)` as a safe fallback.

### JSON Schema for `text`: Non-Empty Trimmed Validation

The epics spec requires that `POST /api/tasks` with `{ "text": "" }` or `{ "text": "   " }` returns 400. Fastify's AJV `minLength: 1` catches the empty-string case. However, AJV does NOT automatically trim whitespace — a `"   "` (spaces only) string of `minLength: 3` would pass schema validation.

**Solution:** Either:
1. Use `minLength: 1` in the schema (catches `""`) AND then call `body.text.trim()` in the handler. If the trimmed value is empty, throw `reply.badRequest('text must not be blank')` manually.
2. Or add a custom AJV keyword for trimmed validation.

**Recommended approach (simpler):** Use `minLength: 1` in JSON Schema + explicit handler guard:

```typescript
fastify.post<{ Body: CreateTaskPayload }>('/', { schema: createTaskSchema }, async (request, reply) => {
  const text = request.body.text.trim()
  if (text.length === 0) {
    return reply.badRequest('body/text must not be empty or whitespace-only')
  }
  const task = repo.create({ text })
  return reply.code(201).send(task)
})
```

### `reply.notFound()` and `reply.badRequest()` from `@fastify/sensible`

`@fastify/sensible` is already registered (Story 2.2). Use these helpers for 4xx responses — they produce properly formatted `{ statusCode, error, message }` errors via the existing `errorHandler.ts`:

```typescript
return reply.notFound(`Task ${id} not found`)
// produces: { statusCode: 404, error: 'Not Found', message: 'Task 42 not found' }

return reply.badRequest('body/text must not be empty or whitespace-only')
// produces: { statusCode: 400, error: 'Bad Request', message: '...' }
```

**Never** construct error objects manually — always use `@fastify/sensible` helpers for 4xx.

### DELETE 204: No Body

`reply.code(204).send()` is the correct pattern. Do NOT send `null`, `undefined`, or an empty object — Fastify v5 will either throw or add unexpected content. Just call `.send()` with no argument for 204.

### `TaskRepository` Construction

`TaskRepository` takes a `Database.Database` instance in its constructor. Construct it inside the route handler plugin using `fastify.db`:

```typescript
const repo = new TaskRepository(fastify.db)
```

This is created once per plugin registration (not per request) which is correct — the repository holds prepared statements that are reused, so constructing per-request would be wasteful.

### ESM Import Extensions (NodeNext)

The project uses `"module": "NodeNext"` and `"moduleResolution": "NodeNext"`. When importing local TypeScript files, use `.js` extension:

```typescript
import { TaskRepository } from '../repositories/TaskRepository.js'
import { createTaskSchema, updateTaskSchema, taskParamsSchema } from './schemas/taskSchemas.js'
```

When importing npm packages (no extension needed):
```typescript
import type { FastifyPluginAsync } from 'fastify'
```

### `user_id` Is NOT in Any Request Body Schema

`user_id` is reserved for future auth and must never be writable via the public API (NFR8). The JSON Schema for POST and PATCH bodies must use `additionalProperties: false` to reject any payload that includes `userId` or `user_id`. The GET/PATCH responses DO include `userId: null` in the returned Task objects (since `Task` from `@shared/types` includes `userId: number | null`).

### `Task.userId` in Response

The `Task` interface exports `userId: number | null`. The `TaskRepository.mapRow()` correctly maps `user_id → userId`. Route responses return `Task` objects directly — they will include `userId: null` in the JSON response. This is expected and correct per the architecture.

### `routes/schemas/taskSchemas.ts` — Full Reference Implementation

```typescript
// Route schemas for task endpoints
// `user_id` must NOT appear in any request body schema (NFR8)

export const createTaskSchema = {
  body: {
    type: 'object',
    required: ['text'],
    additionalProperties: false,
    properties: {
      text: { type: 'string', minLength: 1 },
    },
  },
} as const

export const updateTaskSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' },
    },
  },
  body: {
    type: 'object',
    required: ['completed'],
    additionalProperties: false,
    properties: {
      completed: { type: 'boolean' },
    },
  },
} as const

export const taskParamsSchema = {
  params: {
    type: 'object',
    required: ['id'],
    properties: {
      id: { type: 'integer' },
    },
  },
} as const
```

### `routes/taskRoutes.ts` — Full Reference Implementation

```typescript
import type { FastifyPluginAsync } from 'fastify'
import { TaskRepository } from '../repositories/TaskRepository.js'
import type { CreateTaskPayload, UpdateTaskPayload } from '@shared/types.js'
import { createTaskSchema, updateTaskSchema, taskParamsSchema } from './schemas/taskSchemas.js'

interface TaskParams {
  id: number
}

const taskRoutes: FastifyPluginAsync = async (fastify) => {
  const repo = new TaskRepository(fastify.db)

  // GET /api/tasks
  fastify.get('/', async (_request, reply) => {
    return reply.send(repo.findAll())
  })

  // POST /api/tasks
  fastify.post<{ Body: CreateTaskPayload }>(
    '/',
    { schema: createTaskSchema },
    async (request, reply) => {
      const text = request.body.text.trim()
      if (text.length === 0) {
        return reply.badRequest('body/text must not be empty or whitespace-only')
      }
      const task = repo.create({ text })
      return reply.code(201).send(task)
    }
  )

  // PATCH /api/tasks/:id
  fastify.patch<{ Params: TaskParams; Body: UpdateTaskPayload }>(
    '/:id',
    { schema: updateTaskSchema },
    async (request, reply) => {
      const { id } = request.params
      const task = repo.update(id, request.body)
      if (task === undefined) {
        return reply.notFound(`Task ${id} not found`)
      }
      return reply.send(task)
    }
  )

  // DELETE /api/tasks/:id
  fastify.delete<{ Params: TaskParams }>(
    '/:id',
    { schema: taskParamsSchema },
    async (request, reply) => {
      repo.delete(request.params.id)
      return reply.code(204).send()
    }
  )
}

export default taskRoutes
export const autoPrefix = '/api/tasks'
```

### Why DELETE Doesn't 404 on Missing ID

The epics spec does not require a 404 for `DELETE /api/tasks/:id` when the task doesn't exist. `TaskRepository.delete()` returns `boolean` but the HTTP response is always 204 whether or not a row was affected. This matches REST conventions (idempotent DELETE) and the AC as written.

### Existing File: `routes/root.ts`

Current content:
```typescript
import type { FastifyPluginAsync } from 'fastify'

// Placeholder — task routes are added in Epic 2 (Story 2.3)
const root: FastifyPluginAsync = async (_fastify, _opts): Promise<void> => {}

export default root
```

Update Task 3 is to remove the placeholder comment. The empty handler is fine (autoload-generated).

### Project Structure Notes

- No `src/` subdirectory in `server/` — all paths are flat under `server/`
- Architecture doc references `server/src/routes/schemas/taskSchemas.ts` — the correct path is `server/routes/schemas/taskSchemas.ts`
- Co-located test file for these routes (`taskRoutes.test.ts`) is created in Story 2.4 — not this story
- `@fastify/autoload` discovers `taskRoutes.ts` via recursive fs scan of `routes/`; the `autoPrefix` export sets the URL prefix

### References

- `server/routes/root.ts` — existing placeholder to update [server/routes/root.ts]
- `server/repositories/TaskRepository.ts` — `findAll`, `create`, `update`, `delete` signatures [server/repositories/TaskRepository.ts]
- `shared/types.ts` — `Task`, `CreateTaskPayload`, `UpdateTaskPayload` shapes (note: `Task.userId` exists) [shared/types.ts]
- `server/plugins/errorHandler.ts` — error shape `{ statusCode, error, message }` [server/plugins/errorHandler.ts]
- `server/plugins/sensible.ts` — `reply.notFound()`, `reply.badRequest()` installed [server/plugins/sensible.ts]
- `server/app.ts` — autoload wiring, do NOT modify [server/app.ts]
- Previous story dev notes — flat server layout, NodeNext extension rules, `@fastify/autoload` pattern [_bmad-output/implementation-artifacts/2-2-fastify-plugins-db-cors-error-handler.md#Dev-Notes]
- Architecture — API response formats and status codes [_bmad-output/planning-artifacts/architecture.md#Format-Patterns]
- Architecture — directory structure showing `routes/schemas/taskSchemas.ts` [_bmad-output/planning-artifacts/architecture.md]
- Epic 2, Story 2.3 — acceptance criteria [_bmad-output/planning-artifacts/epics.md]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- All 4 endpoints operational: GET 200, POST 201, PATCH 200/404, DELETE 204
- `additionalProperties: false` on all request body schemas — `user_id` cannot be set via API (NFR8)
- Whitespace-only `text` rejected via explicit `.trim()` + handler guard (AJV `minLength:1` alone wouldn't catch `"   "`)
- Fastify v5 AJV coerces `params.id` to `number` — no manual `parseInt` needed
- `autoPrefix = '/api/tasks'` export used for `@fastify/autoload` prefix — `app.ts` untouched
- Local `.ts` imports use `.ts` extension (Node 24 native strip-types requires literal extension); added `allowImportingTsExtensions: true` to `server/tsconfig.json` to satisfy `tsc --noEmit`
- 18/18 workspace tests pass, 0 TypeScript errors, 0 lint errors

### File List

- server/routes/schemas/taskSchemas.ts (created)
- server/routes/taskRoutes.ts (created)
- server/routes/root.ts (modified — removed placeholder comment)
- server/tsconfig.json (modified — added `allowImportingTsExtensions: true`)

### Review Findings

- [x] [Review][Decision] DELETE non-existent task returns 204 — resolved: keep idempotent 204 (RFC 7231 §4.3.5). `repo.delete()` return value intentionally ignored. [server/routes/taskRoutes.ts:48]
- [x] [Review][Patch] `allowImportingTsExtensions: true` requires `noEmit: true` in tsconfig — fixed: added `"noEmit": true` to `server/tsconfig.json` compilerOptions. [server/tsconfig.json:8]
- [x] [Review][Defer] No response schema on any route [server/routes/taskRoutes.ts] — deferred, pre-existing pattern, not a correctness issue
- [x] [Review][Defer] Params schema `id` has no `minimum: 1` — negative/zero IDs pass schema validation [server/routes/schemas/taskSchemas.ts:16,34] — deferred, de facto safe (repo returns undefined/false for non-existent IDs)
- [x] [Review][Defer] Dual-layer whitespace validation: `minLength:1` in schema + trim guard in handler — documented as intentional but creates inconsistent error messages [server/routes/taskRoutes.ts:22-24] — deferred, pre-existing design decision
