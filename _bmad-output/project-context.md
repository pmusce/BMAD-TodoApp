---
project_name: 'Todo App'
user_name: 'Pasquale'
date: '2026-04-27'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality_rules', 'critical_rules']
status: complete
completedDate: '2026-04-27'
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18.x |
| Frontend language | TypeScript | strict mode |
| Build tool | Vite | 6.x |
| SPA routing | React Router | 7.14.2 |
| Frontend tests | Vitest + @testing-library/react | latest |
| Backend framework | Fastify | v5.x |
| Backend language | TypeScript | strict mode |
| Database driver | better-sqlite3 | 12.9.0 |
| Backend tests | Node.js node:test | built-in |
| E2E tests | @playwright/test | 1.59.1 |
| Backend plugins | @fastify/cors, @fastify/sensible | v5-compatible |
| Logging | Pino (via Fastify), pino-pretty (dev) | built-in |
| Package management | npm workspaces (monorepo) | — |

## Language-Specific Rules

### TypeScript

- Both `client/` and `server/` use **TypeScript strict mode** — `tsconfig.json` in each workspace extends `tsconfig.base.json` at root
- All types for the shared domain (`Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError`) MUST be imported from `@shared/types` — **never redefine them locally**
- The `@shared/*` path alias resolves to `../../shared/*` — available in both `tsc` (via `tsconfig.base.json` `paths`) and Vite (via `vite.config.ts` `resolve.alias`)
- `moduleResolution: "bundler"` is set in `tsconfig.base.json` — use ESM imports throughout, no CommonJS `require()`
- Module augmentation for Fastify lives in `server/src/types/fastify.d.ts` — adds `db: Database` to `FastifyInstance`

### Database / SQL

- All SQL uses `snake_case` for table names and column names (`tasks`, `created_at`, `user_id`) — **never camelCase in SQL**
- All JavaScript/TypeScript objects use `camelCase` — the mapping `snake_case → camelCase` happens **exclusively inside `TaskRepository.ts`**; no caller outside the repository ever sees snake_case field names
- Dates are stored and transmitted as **Unix milliseconds integers** — never ISO strings (`"2026-04-27T10:00:00Z"` is forbidden in DB or API fields)
- `completed` is stored as `INTEGER` (0/1) in SQLite — SQLite has no native BOOLEAN type
- WAL mode MUST be enabled at startup: `db.pragma('journal_mode = WAL')` — called once when the SQLite connection opens

### Imports & Exports

- React components: named exports (`export function TaskItem`) — no default exports for components
- Fastify `app.ts` exports an **async factory function** — it builds and returns the Fastify instance without starting an HTTP listener, enabling test injection

## Framework-Specific Rules

### React / Frontend

- **`useTasks` is the single state source** — it is called ONCE in `HomePage` and its return values passed as props. No child component (`TaskInput`, `TaskList`, `TaskItem`) calls `useTasks` independently. No component imports from `tasksApi` directly.
- **`isLoading` is for initial fetch only** — mutations (create, toggle, delete) use optimistic UI and MUST NOT set `isLoading = true`
- **State shape is fixed** — `{ tasks: Task[], isLoading: boolean, error: string | null }`. Never introduce a `status: 'idle' | 'loading' | 'success' | 'error'` enum — it cannot represent "data loaded but mutation errored" simultaneously
- **Optimistic UI 3-step pattern** (mandatory for all mutations): (1) snapshot current tasks, (2) apply change to local state immediately, (3a) on API success confirm/update, (3b) on API failure roll back to snapshot and set `error` string
- **`error` resets** to `null` on the next successful operation of the same type — never leave stale error state
- **Error strings are user-facing** — never expose raw `Error.message` or API `message` from 500 responses directly in the UI
- `ErrorBoundary` (class component) ONLY catches React render crashes — it does NOT handle fetch/API errors from `useTasks` (those are recoverable and handled via `error` state)
- `BrowserRouter` wraps the app in `main.tsx` — React Router 7 conventions apply

### Fastify / Backend

- **Plugin-first architecture** — all cross-cutting concerns (DB, CORS, error handler) are registered as Fastify plugins in `plugins/`, never inline in route handlers
- **All routes use JSON Schema validation** — every route with a body or params has a Fastify JSON Schema object defined in `routes/schemas/taskSchemas.ts`
- **Error responses are always `{ statusCode, error, message }`** — no stack traces, no raw DB error messages, no internal details. The custom error handler in `plugins/errorHandler.ts` enforces this
- **`@fastify/sensible`** provides `reply.notFound()`, `reply.badRequest()` etc. — use these helpers for 4xx responses, never construct error objects manually
- **`user_id` is NEVER in any request body schema** — it is reserved for future auth and must not be writable via the public API
- Success responses return the resource or array directly — **no `{ data: ..., success: true }` envelope**
- HTTP status codes: 200 GET/PATCH, 201 POST, 204 DELETE, 400 validation, 404 not found, 500 internal

### Monorepo Structure

- `client/` and `server/` are npm workspaces — run commands from monorepo root with `--workspace` flags or `npm run X --workspaces`
- `shared/types.ts` is at monorepo root — it is NOT a workspace, just a directory. Both workspaces import via `@shared/types` alias
- `fastify-cli generate` creates a `server/test/` directory by default — **delete it**; tests are co-located per project conventions

## Testing Rules

### Test File Location

- **Co-located test files** — every test file lives in the same directory as the source file it tests: `TaskItem.tsx` → `TaskItem.test.tsx`, `taskRoutes.ts` → `taskRoutes.test.ts`
- **Exception:** Playwright E2E tests live in `e2e/tests/` at the monorepo root — they are not co-located because they test the full stack
- **Forbidden:** `__tests__/` folders or a separate `test/` directory inside `src/` for unit/component tests

### Mock Boundaries (Critical)

Each test layer mocks at its own boundary — never deeper:

| Test target | What is mocked |
|-------------|---------------|
| Hook tests (`useTasks.test.ts`) | `tasksApi` module |
| Route tests (`taskRoutes.test.ts`) | `TaskRepository` class |
| Repository tests (`TaskRepository.test.ts`) | Nothing — uses **in-memory SQLite** (`:memory:`) |
| E2E tests (Playwright) | Nothing — tests the fully running stack via browser |

### Frontend Testing (Vitest + React Testing Library)

- Test runner: `vitest run` in `client/` — configured via `vite.config.ts`
- Coverage: `vitest run --coverage` — required to reach ≥80% on `src/hooks/` and `src/components/`
- Use `@testing-library/react` `render`, `screen`, `fireEvent` / `userEvent` — test behaviour, not implementation details
- Test files must be `.test.tsx` for components, `.test.ts` for hooks and utilities

### Backend Testing (Node.js `node:test`)

- Test runner: `node --test` in `server/` — no external test framework
- Repository tests open an **in-memory SQLite database** (`new Database(':memory:')`) — no real file I/O
- Route tests inject a mock `TaskRepository` via dependency injection or module replacement — no real SQLite opened
- Test files must be `.test.ts` co-located with their source

### E2E Testing (Playwright)

- `playwright.config.ts` at monorepo root configures `webServer` to start both Vite dev server and Fastify before tests run
- Run via `npm run test:e2e` at monorepo root
- E2E tests run on push to `main` only (not on feature branches) — enforced by `.github/workflows/e2e.yml`
- No hardcoded `localhost` port values in specs — use `baseURL` from `playwright.config.ts`

## Code Quality & Style Rules

### Naming Conventions

| Element | Convention | Example |
|---------|-----------|----------|
| SQL table names | `snake_case` plural | `tasks` |
| SQL column names | `snake_case` | `created_at`, `user_id` |
| TypeScript interfaces / types | `PascalCase` | `Task`, `ApiError` |
| JSON API fields | `camelCase` | `createdAt`, `userId` |
| React components (file + export) | `PascalCase` | `TaskItem.tsx`, `export function TaskItem` |
| React hooks | `camelCase` prefixed `use` | `useTasks.ts` |
| Server route modules | `camelCase` + `Routes` suffix | `taskRoutes.ts` |
| Repository modules | `PascalCase` + `Repository` suffix | `TaskRepository.ts` |
| Test files | Same name as source + `.test.` | `TaskItem.test.tsx` |
| Utility / helper files | `camelCase` | `dateUtils.ts` |

### ESLint

- ESLint with `typescript-eslint` is configured from day 1 — `npm run lint --workspaces` must pass with zero errors before any PR
- Client `.eslintrc.js` and server `.eslintrc.js` both extend the shared `.eslintrc.base.js` at monorepo root
- CI (`ci.yml`) runs lint on every push to every branch — a lint failure blocks the run

### File & Folder Structure

```
client/src/
  api/          ← fetch wrappers only (tasksApi.ts)
  hooks/        ← custom hooks + co-located tests
  components/   ← React components + co-located tests
  pages/        ← route-level page components
  styles/       ← global CSS only

server/src/
  plugins/      ← Fastify plugins (db, cors, errorHandler)
  routes/       ← route handlers + schemas/ subfolder
  repositories/ ← data access only (TaskRepository)
  types/        ← TypeScript augmentations (fastify.d.ts)
```

### Environment Variables

- `.env` files are **gitignored** — only `.env.example` files are committed
- Client: `VITE_API_URL` (must be prefixed `VITE_` to be exposed by Vite to the browser)
- Server: `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`
- Never hardcode `localhost` URLs — always read from env vars

## Critical Don't-Miss Rules

### Anti-Patterns — Never Do These

| Anti-pattern | Why it's wrong | Correct approach |
|---|---|---|
| `camelCase` column in SQL (`createdAt`) | Breaks SQL tooling | `created_at` in SQL, map to `camelCase` in `TaskRepository` |
| `{ data: [...], success: true }` API response | Adds indirection | Return resource/array directly |
| ISO date strings in DB or API (`"2026-04-27"`) | Timezone-fragile, harder to sort | Unix milliseconds integer everywhere |
| Duplicate `Task` interface in `client/` or `server/` | Types diverge over time | Always import from `@shared/types` |
| Test files in `__tests__/` under `src/` | Violates co-location convention | Place `Foo.test.ts` next to `Foo.ts` |
| `isLoading = true` during mutations | Creates false loading UX | Mutations are optimistic — no loading state |
| `status` enum instead of `isLoading`/`error` flags | Can't represent "loaded + errored" simultaneously | Keep `{ isLoading: boolean, error: string \| null }` |
| Raw `Error.message` or 500 API message shown to user | Exposes implementation details | Map to user-facing string in `useTasks` |
| Stack traces in API error responses | Security risk (NFR7) | `{ statusCode, error, message }` only, via `errorHandler.ts` |
| SQL strings outside `TaskRepository.ts` | Violates data boundary | All SQL lives in `TaskRepository.ts` and `migrations/` only |
| `fetch` calls outside `tasksApi.ts` | Violates API boundary | Only `tasksApi.ts` calls `fetch` |
| Returning raw SQLite row objects from routes | Exposes `snake_case` field names | `TaskRepository` maps all rows to `camelCase` before returning |

### Accessibility (Baked In — Not Optional)

- Every `<input>` must have an associated `<label>` (via `htmlFor`/`id`) or `aria-label`
- Every icon-only button must have `aria-label` describing its action (e.g. `aria-label="Delete task"`)
- Error state updates must use `aria-live="polite"` — screen readers must announce errors
- All interactive elements must show a visible focus ring meeting ≥3:1 contrast (CSS focus styles)
- Touch targets for checkbox and delete button: minimum 44×44 CSS px

### Security

- `user_id` must never appear in any request body JSON Schema — it is not writable by clients
- Fastify body size limit is 64KB (default) — do not raise this
- CORS `origin` comes from `CORS_ORIGIN` env var — never hardcode a client URL in plugins
- DB file (`server/data/todo.db`) must be in `.gitignore` — never commit SQLite state

### Deployment Gotchas

- Railway needs a **persistent volume** mounted at `DATABASE_PATH` — without it, the SQLite file is lost on restart
- Vercel requires `VITE_API_URL` set as an environment variable pointing to the Railway URL — without it, the SPA will call `undefined/api/tasks`
- Client `.env` and server `.env` are both gitignored — `.env.example` files must be kept up to date
