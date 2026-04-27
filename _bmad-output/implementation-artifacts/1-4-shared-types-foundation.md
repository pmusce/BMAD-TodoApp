# Story 1.4: Shared Types Foundation

Status: done

## Story

As a developer,
I want a `shared/types.ts` module exporting the core domain types,
so that client and server share a single, authoritative contract for the Task entity with no duplication.

## Acceptance Criteria

1. **Given** `shared/types.ts` exists at the monorepo root **When** reviewed **Then** it exports: `Task { id: number, text: string, completed: boolean, createdAt: number }`, `CreateTaskPayload { text: string }`, `UpdateTaskPayload { completed: boolean }`, `ApiError { statusCode: number, error: string, message: string }`
2. **Given** a file in `client/src/` contains `import type { Task } from '@shared/types'` **When** TypeScript compiles the client workspace **Then** no type errors are reported
3. **Given** a file in `server/` contains `import type { Task } from '@shared/types'` **When** TypeScript compiles the server workspace **Then** no type errors are reported
4. **Given** the entire codebase is searched for `interface Task` or `type Task =` **When** the search completes **Then** no definition of `Task` exists anywhere except `shared/types.ts`

## Tasks / Subtasks

- [x] Task 1 — Verify `shared/types.ts` content (AC: 1, 4)
  - [x] Confirm `shared/types.ts` exists at monorepo root (it was scaffolded in Story 1.1)
  - [x] Confirm it exports all four types with exact shapes from AC1 — make no changes if correct
  - [x] Run `grep -r "interface Task\|type Task " --include="*.ts" --include="*.tsx" . | grep -v shared/types.ts | grep -v node_modules` from monorepo root — result must be empty

- [x] Task 2 — Create co-located test `shared/types.test.ts` (AC: 1)
  - [x] Create `shared/types.test.ts` next to `shared/types.ts` — required by the co-located test convention
  - [x] Use `node:test` runner (same as server); import types with `import type` from `./types.ts` (relative, not alias — `shared/` is not in any workspace tsconfig include)
  - [ ] Test content: structural runtime assertions proving each type's shape is correct:
    ```typescript
    import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from './types.ts'
    import { test } from 'node:test'
    import assert from 'node:assert/strict'

    test('Task satisfies required shape', () => {
      const task: Task = { id: 1, text: 'buy milk', completed: false, createdAt: 1_000_000 }
      assert.strictEqual(typeof task.id, 'number')
      assert.strictEqual(typeof task.text, 'string')
      assert.strictEqual(typeof task.completed, 'boolean')
      assert.strictEqual(typeof task.createdAt, 'number')
    })

    test('CreateTaskPayload satisfies required shape', () => {
      const p: CreateTaskPayload = { text: 'buy milk' }
      assert.strictEqual(typeof p.text, 'string')
    })

    test('UpdateTaskPayload satisfies required shape', () => {
      const p: UpdateTaskPayload = { completed: true }
      assert.strictEqual(typeof p.completed, 'boolean')
    })

    test('ApiError satisfies required shape', () => {
      const e: ApiError = { statusCode: 404, error: 'Not Found', message: 'Task not found' }
      assert.strictEqual(typeof e.statusCode, 'number')
      assert.strictEqual(typeof e.error, 'string')
      assert.strictEqual(typeof e.message, 'string')
    })
    ```
  - [x] Run directly: `node --test shared/types.test.ts` from monorepo root to verify it passes

- [x] Task 3 — Add server-side alias smoke test (AC: 3)
  - [x] Create `server/shared-types.smoke.test.ts` in the `server/` workspace
  - [x] This proves that `@shared/types` resolves within the server's TypeScript compilation (NodeNext moduleResolution) and that `node --test` can run it with strip-types
  - [ ] Content:
    ```typescript
    import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from '@shared/types'
    import { test } from 'node:test'
    import assert from 'node:assert/strict'

    test('@shared/types — Task resolves in server workspace', () => {
      const task: Task = { id: 1, text: 'buy milk', completed: false, createdAt: 1_000_000 }
      assert.strictEqual(typeof task.id, 'number')
    })

    test('@shared/types — CreateTaskPayload resolves in server workspace', () => {
      const p: CreateTaskPayload = { text: 'buy milk' }
      assert.strictEqual(typeof p.text, 'string')
    })

    test('@shared/types — UpdateTaskPayload resolves in server workspace', () => {
      const p: UpdateTaskPayload = { completed: true }
      assert.strictEqual(typeof p.completed, 'boolean')
    })

    test('@shared/types — ApiError resolves in server workspace', () => {
      const e: ApiError = { statusCode: 404, error: 'Not Found', message: 'task not found' }
      assert.strictEqual(typeof e.statusCode, 'number')
    })
    ```
  - [x] Run `npx tsc --noEmit` in `server/` — must exit 0
  - [x] Run `node --test` in `server/` — must exit 0

- [x] Task 4 — Add client-side alias smoke test (AC: 2)
  - [x] Create `client/src/shared-types.smoke.test.ts` in the client workspace
  - [x] This proves Vitest resolves `@shared/types` via the Vite `@shared` alias at both TypeScript type-check time and Vitest runtime
  - [ ] Content:
    ```typescript
    import type { Task, CreateTaskPayload, UpdateTaskPayload, ApiError } from '@shared/types'
    import { describe, it, expect } from 'vitest'

    describe('@shared/types resolution in client workspace', () => {
      it('Task has correct runtime shape', () => {
        const task: Task = { id: 1, text: 'buy milk', completed: false, createdAt: 1_000_000 }
        expect(typeof task.id).toBe('number')
        expect(typeof task.text).toBe('string')
        expect(typeof task.completed).toBe('boolean')
        expect(typeof task.createdAt).toBe('number')
      })

      it('CreateTaskPayload has correct runtime shape', () => {
        const p: CreateTaskPayload = { text: 'buy milk' }
        expect(typeof p.text).toBe('string')
      })

      it('UpdateTaskPayload has correct runtime shape', () => {
        const p: UpdateTaskPayload = { completed: true }
        expect(typeof p.completed).toBe('boolean')
      })

      it('ApiError has correct runtime shape', () => {
        const e: ApiError = { statusCode: 404, error: 'Not Found', message: 'task not found' }
        expect(typeof e.statusCode).toBe('number')
      })
    })
    ```
  - [x] Run `npx tsc --noEmit` in `client/` — must exit 0
  - [x] Run `npm run test` in `client/` — must exit 0

- [x] Task 5 — Verification (AC: 1–4)
  - [x] `npx tsc --noEmit -p client/tsconfig.json` → exits 0
  - [x] `npx tsc --noEmit -p server/tsconfig.json` → exits 0
  - [x] `npm test --workspaces --if-present` from monorepo root → all exit 0
  - [x] `grep -r "interface Task\|type Task " --include="*.ts" --include="*.tsx" . | grep -v shared/types.ts | grep -v node_modules` → empty result

## Dev Notes

### Current State (as of Story 1.3)

`shared/types.ts` already exists at the monorepo root with all four required exports — it was created during the monorepo scaffold (Story 1.1). **Verify first; change nothing if correct.** The `@shared/*` TypeScript alias and the Vite `@shared` runtime alias are also already configured. The verification and smoke-test files in Tasks 2–4 are the primary deliverable of this story.

### `shared/types.ts` — Required Exact Content

```typescript
export interface Task {
  id: number
  text: string
  completed: boolean
  createdAt: number // Unix milliseconds — never ISO string
}

export interface CreateTaskPayload {
  text: string
}

export interface UpdateTaskPayload {
  completed: boolean
}

export interface ApiError {
  statusCode: number
  error: string
  message: string
}
```

> The existing file may use semicolons in interface bodies — that is fine. Do NOT change style. Only verify the exported members and types match exactly.
> `createdAt: number` stores **Unix milliseconds** — not seconds, not ISO strings.
> `completed: boolean` in TypeScript → stored as `INTEGER` 0/1 in SQLite (mapping handled exclusively in `TaskRepository.ts` in Story 2.1).

### Critical Rule: ALWAYS use `import type` from `@shared/types`

This is **the most important rule for this and all future stories**. Node.js native TypeScript strip-types (used by fastify-cli's `fastify start` and `node --test`) does NOT resolve TypeScript path aliases (`@shared/*`) at runtime — it only strips type annotations. The resolution of `@shared/types` as a Node.js module would fail.

However, `import type` statements are **completely removed** by strip-types before any module resolution occurs. The import never reaches Node.js's module resolver.

**Correct — always:**
```typescript
import type { Task, CreateTaskPayload } from '@shared/types'
```

**FORBIDDEN — bare import:**
```typescript
import { Task } from '@shared/types'   // ❌ — Node.js tries to resolve '@shared/types' at runtime → fails
```

The Vite client build DOES handle the `@shared` alias at bundle time, so bare imports would work in the client. However, use `import type` universally for consistency and safety — it's correct in both environments.

### How the `@shared/*` Alias Resolves in Each Workspace

**TypeScript (both workspaces):**
`tsconfig.base.json` at monorepo root declares:
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@shared/*": ["shared/*"] }
  }
}
```
`baseUrl: "."` is relative to `tsconfig.base.json`'s directory (monorepo root). So `@shared/types` → `<monorepo-root>/shared/types.ts`.

Both `client/tsconfig.json` (`extends: "../tsconfig.base.json"`) and `server/tsconfig.json` (`extends: "../tsconfig.base.json"`) inherit this. TypeScript path resolution works correctly in both.

**Note:** The architecture document shows `"@shared/*": ["../../shared/*"]` — this is INCORRECT for the actual structure. The actual value `"shared/*"` with `baseUrl: "."` at the monorepo root is equivalent and correct. Do NOT change it.

**Vite (client build + Vitest):**
`client/vite.config.ts` declares:
```typescript
resolve: {
  alias: {
    '@shared': fileURLToPath(new URL('../shared', import.meta.url)),
  },
},
```
This maps `@shared` → `<monorepo-root>/shared/` at Vite build/dev/test time. Vitest uses this same alias configuration (Vitest inherits `vite.config.ts`). No additional configuration is needed — it is already in place from Story 1.2.

**Node.js / fastify-cli (server runtime):**
`@shared/types` is NEVER resolved at runtime on the server. All server imports from `@shared/types` must use `import type`, which is stripped before runtime resolution. This constraint applies to Story 1.4 and all future stories.

### `server/tsconfig.json` — NodeNext Module Resolution

`server/tsconfig.json` overrides `module: "NodeNext"` and `moduleResolution: "NodeNext"`. Under NodeNext, TypeScript enforces that relative imports include explicit `.js` extensions. However, path alias imports (`@shared/types`) are non-relative and resolve through the `paths` table — no extension is required or expected. TypeScript resolves `@shared/types` → `shared/types.ts` (via paths) during type-checking regardless of the module mode.

### `shared/types.test.ts` — Co-Location vs. tsconfig Exclude

`shared/types.test.ts` is co-located per the architecture convention ("every source file has a sibling `.test.ts(x)` file"). However, it is NOT included in `server/tsconfig.json` or `client/tsconfig.json` — those includes scopes are `server/` and `client/src/` respectively.

Run `shared/types.test.ts` directly: `node --test shared/types.test.ts` from the monorepo root. This uses Node.js v24 native TypeScript stripping. The import `from './types.ts'` uses a relative path (not the alias) because the `@shared/*` alias is not configured at the root tsconfig level for type-checking outside the workspaces.

### Files Touched by This Story

| File | Status | Notes |
|------|--------|-------|
| `shared/types.ts` | VERIFY (no change expected) | All 4 types must be present with exact shapes |
| `shared/types.test.ts` | NEW | Co-located test; run directly with `node --test` |
| `server/shared-types.smoke.test.ts` | NEW | Proves `@shared/types` resolves in server tsconfig + node:test |
| `client/src/shared-types.smoke.test.ts` | NEW | Proves `@shared/types` resolves in Vitest |

### Anti-Patterns to Avoid

| Anti-pattern | Correct approach |
|---|---|
| `import { Task } from '@shared/types'` | `import type { Task } from '@shared/types'` always |
| `interface Task { ... }` in any file except `shared/types.ts` | Import from `@shared/types` exclusively |
| `import type { Task } from '../../shared/types'` | Always use the `@shared/types` alias |
| Adding `"paths"` override to `server/tsconfig.json` or `client/tsconfig.json` | Already inherited from `tsconfig.base.json` — do NOT re-declare |
| Changing `"@shared/*": ["shared/*"]` to `["../../shared/*"]` | Current value is correct; architecture doc is wrong |
| Adding runtime value exports to `shared/types.ts` | Keep it types-only; runtime values would require alias runtime resolution |

### References

- [Architecture: Shared Types](../_bmad-output/planning-artifacts/architecture.md#shared-contract-single-source-of-truth) — gap analysis and resolution
- [Project Context: TypeScript rules](../_bmad-output/project-context.md#language-specific-rules) — `import type` mandate, `@shared/types` alias usage
- [tsconfig.base.json](../../tsconfig.base.json) — shared compiler options, `baseUrl`, `paths`
- [client/vite.config.ts](../../client/vite.config.ts) — `@shared` Vite alias (runtime + Vitest)
- [server/tsconfig.json](../../server/tsconfig.json) — `NodeNext` module override
- [Story 1.1 done](../../_bmad-output/implementation-artifacts/1-1-monorepo-root-scaffold.md) — where `shared/types.ts` was first created
- [Story 1.2 done](../../_bmad-output/implementation-artifacts/1-2-frontend-workspace-bootstrap.md) — where Vite `@shared` alias and client tsconfig were configured
- [Story 1.3 done](../../_bmad-output/implementation-artifacts/1-3-backend-workspace-bootstrap.md) — where `server/tsconfig.json` NodeNext override was established

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

### Completion Notes List

1. **NodeNext requires `.js` extension for path-aliased imports in server code.** The story's Dev Notes claimed path alias imports under NodeNext require no extension, but this is incorrect. Under NodeNext, `import type { Task } from '@shared/types'` fails with `TS2307` because NodeNext treats the extensionless mapped path `shared/types` as a directory lookup. The correct form is `import type { Task } from '@shared/types.js'` — TypeScript strips `.js` and resolves to `shared/types.ts`. All future server files importing from `@shared` must use the `.js` extension.

2. **`rootDir: ".."` (monorepo root) required in `server/tsconfig.json`.** With `rootDir: "."` (server/), TypeScript raises `TS6059` when `shared/types.ts` is pulled into the compilation via the `@shared/types.js` path alias (the file is outside server'). Setting `rootDir: ".."` (monorepo root) makes `shared/types.ts` a valid compilation source. This is the standard fix for cross-workspace type sharing under NodeNext without project references.

3. **`start` script updated: `node build/server.js` → `node build/server/server.js`.** With `rootDir: ".."`, TypeScript's output structure mirrors the rootDir-relative paths. Server files compile to `build/server/*.js` (not `build/*.js`). The npm `start` script was updated accordingly.

### File List

| File | Change |
|------|--------|
| `shared/types.ts` | VERIFIED — no modification required |
| `shared/types.test.ts` | NEW — co-located test, 4/4 pass via `node --test` |
| `server/shared-types.smoke.test.ts` | NEW — server alias smoke test, tsc OK + 4/4 pass |
| `client/src/shared-types.smoke.test.ts` | NEW — client alias smoke test, tsc OK + 4/4 Vitest pass |
| `server/tsconfig.json` | MODIFIED — `rootDir: "."` → `rootDir: ".."` |
| `server/package.json` | MODIFIED — `start` script: `node build/server.js` → `node build/server/server.js` |

### Review Findings

- [x] [Review][Patch] Inconsistent `ApiError` fixture message casing — `shared/types.test.ts` uses `'Task not found'` (capital T) while both smoke tests use `'task not found'` (lowercase); normalise to lowercase across all three files [`shared/types.test.ts:24`]
- [x] [Review][Patch] Missing `UpdateTaskPayload { completed: false }` boundary test — only `true` is exercised in all three test files; a serialization bug coercing `false → null` would pass every current assertion undetected [`shared/types.test.ts:19`, `server/shared-types.smoke.test.ts:16`, `client/src/shared-types.smoke.test.ts:17`]
- [x] [Review][Defer] `fastify-cli` missing from `server/package.json` devDependencies [`server/package.json:8`] — deferred, pre-existing (Story 1-3 scaffold)
- [x] [Review][Defer] `eslint` missing from `server/package.json` devDependencies [`server/package.json:13`] — deferred, pre-existing (Story 1-3 scaffold)
- [x] [Review][Defer] `--ext .ts` flag unsupported in ESLint v9 [`server/package.json:13`] — deferred, pre-existing (Story 1-3 scaffold)
- [x] [Review][Defer] `pino-pretty` in runtime `dependencies` instead of `devDependencies` [`server/package.json:28`] — deferred, pre-existing (Story 1-3 scaffold)
- [x] [Review][Defer] `@types/node ^25.0.3` targets non-LTS Node release [`server/package.json:30`] — deferred, pre-existing (Story 1-3 scaffold)
- [x] [Review][Defer] No `engines` field declaring minimum Node.js version [`server/package.json`] — deferred, pre-existing (Story 1-3 scaffold)
- [x] [Review][Defer] `rootDir: ".."` + `start: "node build/server/server.js"` coupling is fragile [`server/tsconfig.json:5`, `server/package.json:9`] — deferred, intentional architectural decision; documented in Completion Notes
- [x] [Review][Defer] No CI-integrated test script for `shared/types.test.ts` in root `package.json` — deferred, future CI/infrastructure story
- [x] [Review][Defer] `@ts-expect-error` negative shape tests not present in any test file — deferred, future enhancement
