---
stepsCompleted: [step-01-init, step-02-context, step-03-starter, step-04-decisions, step-05-patterns, step-06-structure, step-07-validation, step-08-complete]
inputDocuments:
  - _bmad-output/planning-artifacts/product-brief-todo-app.md
  - _bmad-output/planning-artifacts/product-brief-todo-app-distillate.md
  - _bmad-output/planning-artifacts/prd.md
workflowType: 'architecture'
status: 'complete'
completedDate: '2026-04-27'
project_name: 'Todo App'
user_name: 'Pasquale'
date: '2026-04-27'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements (31 FRs across 6 areas):**

| Capability Area | FR Count | Architectural Weight |
|-----------------|----------|---------------------|
| Task Management | 5 | Core domain — CRUD + optimistic UI |
| Task List Display | 5 | Pure read-path + derived sort/group logic |
| Application States | 5 | State machine: idle / loading / error / degraded |
| Data Persistence | 4 | REST API contract + data model |
| Accessibility & Navigation | 5 | Cross-cutting — affects every interactive component |
| Application Infrastructure | 7 | SPA scaffold, error boundary, test + lint requirements |

The FRs define a **thin-domain, thick-reliability** system. Domain logic is trivial (CRUD on tasks); the non-trivial work is error handling, state transitions, and optimistic UI — all routing concerns for both the frontend state layer and the API response contract.

**Non-Functional Requirements (17 NFRs — 4 categories):**

- **Performance** (NFR1–5): 300ms UI interactions, 1.5s initial load, 200ms API P95, CLS < 0.1 — achievable on any modern stack; primarily constrain what renders at startup and how async is handled
- **Security** (NFR6–9): HTTPS in prod, no internal error leakage, `user_id` not writable via public API, payload validation — shapes API middleware and error serialiser design
- **Accessibility** (NFR10–14): WCAG 2.1 A, keyboard-only operability, 3:1 focus contrast, aria-live regions — cross-cuts every React component; a11y conventions must be baked into component structure from day 1
- **Reliability** (NFR15–17): No silent failures, partial functionality on backend loss, error boundary — drives frontend state architecture more than backend

**Scale & Complexity:**

- Primary domain: Full-stack web (React SPA + REST API)
- Complexity level: Low — single entity (tasks), single user, no auth, no real-time, no multi-tenancy
- Estimated architectural components: ~6 (UI layer, API client, backend routes, data layer, error handling, test infrastructure)

---

### Technical Constraints & Dependencies

- **Frontend:** React + TypeScript (strict mode)
- **Backend:** Node.js + Fastify + TypeScript
- **Database:** SQLite (driver/ORM to be decided in tech stack step)
- **State management:** useState/useReducer/Context only — no external library
- **Rendering:** Pure client-side SPA — no SSR/SSG/hydration
- **Auth:** None in v1 — `user_id` nullable, not writable via public API
- **Browser support:** Evergreen only (last 2 versions of Chrome, Firefox, Safari, Edge)
- **Deployment target:** Docker Compose (multi-container local/dev orchestration; no cloud deployment in v1)

---

### Cross-Cutting Concerns

| Concern | Affects |
|---------|---------|
| **Error handling** | Every async operation (create, toggle, delete, load) — frontend state + API response contract |
| **Optimistic UI** | Task create, toggle, delete — needs rollback strategy on API failure |
| **Accessibility** | Every interactive React component — keyboard nav, focus management, ARIA |
| **TypeScript strict** | Entire codebase — frontend and backend share type contract for task entity |
| **Data contract / API shape** | Frontend API client ↔ Fastify routes ↔ SQLite layer — must be consistent |
| **Test coverage ≥80%** | Business logic + API endpoints — affects folder structure and module boundaries |
| **ESLint clean** | Entire codebase — linting configured from day 1 |

---

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web application: separate React SPA (client) + Fastify REST API (server), co-located in a single monorepo.

### Project Structure

**Monorepo (single repo, two npm workspaces)** — single developer, simpler DX, single README, shared TypeScript config, one git history.

```
todo-app/
├── client/          # Vite + React + TypeScript SPA
├── server/          # Fastify + TypeScript REST API
├── package.json     # workspace root (npm workspaces)
└── README.md
```

### Selected Starter — Frontend: create-vite (react-ts)

**Initialization command:**

```bash
npm create vite@latest client -- --template react-ts
```

**Architectural decisions provided:**

- Language: TypeScript (tsconfig strict defaults)
- Build tool: Vite v6 (ESM, fast HMR, esbuild for dev, Rollup for prod)
- Module system: ESM throughout
- Dev server: Vite dev server (port 5173 default)
- Linting: ESLint config included in Vite scaffolding
- Not included — to be added: React Router, Vitest + React Testing Library

### Selected Starter — Backend: fastify-cli (TypeScript)

**Initialization command:**

```bash
npm install -g fastify-cli
fastify generate server --lang=ts
```

**Architectural decisions provided:**

- Language: TypeScript
- Framework: Fastify v5.x with plugin-first architecture
- Logging: Pino (structured JSON, built-in)
- Project structure: `plugins/`, `routes/`, `test/` + `app.ts` entry point
- Dev script: `fastify start -l info -P app.ts` with pino-pretty
- Test infrastructure: Node.js built-in test runner (`node:test`)
- Lifecycle: `close-with-grace` for graceful shutdown

### Additions Beyond the Starters

| Addition | Target | Reason |
|----------|--------|--------|
| React Router | client | SPA routing (FR25) |
| Vitest + React Testing Library | client | Unit/component test coverage ≥80% (FR31) |
| `@playwright/test` | e2e (root) | Full-stack E2E tests covering 4 core journeys |
| `better-sqlite3` + `@types/better-sqlite3` | server | SQLite data layer |
| `@fastify/cors` | server | Allow client origin in development |
| `@fastify/sensible` | server | Standard HTTP error helpers |
| ESLint + `typescript-eslint` | both | Unified lint config from day 1 (FR30) |

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical (block implementation):** data schema, API contract, error response shape, deployment target  
**Important (shape architecture):** state management pattern, SQLite access pattern, test strategy  
**Deferred (post-MVP):** auth, database migration tooling  

---

### Data Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|----------|
| SQLite driver | `better-sqlite3` | 12.9.0 | Fastest synchronous API for Node.js; TypeScript types via `@types/better-sqlite3`; 5.8M weekly downloads |
| Query style | Raw SQL via prepared statements | — | Single table, low complexity — ORM is unnecessary overhead; prepared statements prevent SQL injection |
| WAL mode | Enabled at startup | — | SQLite best practice: `db.pragma('journal_mode = WAL')` at server init |
| DB file location | `server/data/todo.db` (gitignored) | — | Predictable path; excluded from version control |
| Schema migrations | Manual SQL files in `server/migrations/` | — | Zero-dependency approach appropriate for single-table v1; no migration runner needed |
| Task schema | `id` INTEGER PK AUTOINCREMENT, `text` TEXT NOT NULL, `completed` INTEGER DEFAULT 0, `created_at` INTEGER (Unix ms), `user_id` INTEGER NULL | — | Matches FR1–FR4, FR19; integer boolean for SQLite compatibility |

---

### Authentication & Security

| Decision | Choice | Rationale |
|----------|--------|----------|
| Auth in v1 | None | Explicitly out of scope; `user_id` reserved but not surfaced via API |
| CORS | `@fastify/cors` — allow `http://localhost:5173` in dev, env-configurable in prod | NFR6; client and server run on different ports in dev |
| Error serialisation | `@fastify/sensible` + custom error handler returning `{ statusCode, error, message }` only | NFR7 — no stack traces or internal details in responses |
| Payload validation | Fastify JSON Schema on every route body and params | NFR9 — reject malformed or oversized payloads at route level |
| Payload size limit | 64KB body limit (Fastify default) | Adequate for task text; prevents trivial abuse |

---

### API & Communication Patterns

| Decision | Choice | Rationale |
|----------|--------|----------|
| API style | REST | Simple CRUD — GraphQL is unnecessary overhead |
| Base path | `/api/tasks` | Clear namespace; separates API from any future static routes |
| Endpoints | `GET /api/tasks`, `POST /api/tasks`, `PATCH /api/tasks/:id`, `DELETE /api/tasks/:id` | FR17 — full CRUD |
| Success response | Return resource or array directly (no envelope) | Lean; consistent with Fastify conventions |
| Error response | `{ statusCode, error, message }` | NFR7; uniform shape across all failure modes |
| HTTP status codes | 200 GET/PATCH, 201 POST, 204 DELETE, 400 validation, 404 not found, 500 internal | RFC-compliant |
| API documentation | Fastify JSON Schema inline (doubles as validation + schema docs) | No separate Swagger tooling needed for v1 |
| Rate limiting | None in v1 | Single user, local/dev deployment — deferred to post-MVP |

---

### Frontend Architecture

| Decision | Choice | Version | Rationale |
|----------|--------|---------|----------|
| Routing | React Router | 7.14.2 | FR25; built-in TypeScript types; v7 is current stable |
| Routes in v1 | Single route `/` | — | Single view in MVP |
| State management | `useState` + `useReducer` for task list; `useContext` if prop drilling emerges | — | FR restraint — no Redux/Zustand |
| API layer | Custom `useTasks` hook wrapping `fetch` | — | Centralises all API calls; encapsulates loading/error state; easy to test |
| Optimistic UI | Immediate local state update → API call → rollback on failure | — | FR5; journeys 1, 2, 3 |
| Error boundary | Single `<ErrorBoundary>` at app root | — | FR28, NFR17 |
| Unit/component tests | Vitest + React Testing Library | latest | FR31 — ≥80% coverage on business logic; native Vite integration |

---

### Testing Strategy

**QA integration principle:** Test infrastructure is bootstrapped in step 1 alongside the project scaffold, not added at the end. Unit tests are written for each module immediately after that module is implemented. E2E tests are written once the full stack is running end-to-end.

| Layer | Tool | Version | Scope |
|-------|------|---------|-------|
| Unit — client | Vitest + React Testing Library | latest | Component logic, hook behaviour, pure functions |
| Unit — server | Node.js `node:test` | built-in | Route handlers, repository functions, JSON Schema validation |
| E2E | Playwright | 1.59.1 | Full user journeys against the running full stack |

**E2E location:** `e2e/` at monorepo root. Playwright starts both services via `webServer` config in `playwright.config.ts`.

**E2E coverage (MVP):**
- Create a task → appears in active list
- Complete a task → moves to completed group with strikethrough
- Delete a task → removed from list
- API failure → inline error state displayed

**CI gates:**
- Unit tests: run on every push to every branch
- E2E tests: run on push to `main` only

---

### Infrastructure & Deployment

| Decision | Choice | Rationale |
|----------|--------|----------|
| Containerization | Docker Compose | Multi-container orchestration for frontend (nginx), backend (Node.js), and SQLite volume; single `docker compose up` to run the full stack |
| Frontend container | nginx serving Vite build | Multi-stage Dockerfile: build stage (Vite) + production stage (nginx); non-root user; health check |
| Backend container | Node.js running Fastify | Multi-stage Dockerfile: build stage (TypeScript compile) + production stage (Node.js); non-root user; health check via `/api/healthz` |
| Environment config | `.env` files gitignored; `VITE_API_URL` on client; `PORT`, `DATABASE_PATH`, `CORS_ORIGIN` on server | 12-factor approach; compose profiles for dev/test |
| CI/CD | GitHub Actions: lint + unit tests on all pushes; E2E on `main` | NFR30, NFR31 — quality gates before merge |
| Logging | Pino (provided by Fastify) — JSON in prod, pino-pretty in dev | Structured logs; accessible via `docker compose logs` |
| Monitoring | Docker health checks + `docker compose logs` | Appropriate for solo learning project; containers report health status |

---

### Decision Impact — Implementation Sequence

1. **Monorepo scaffold + test infrastructure** — ESLint + TypeScript config (both workspaces); install and configure Vitest in `client/vite.config.ts`; verify `node:test` available; install `@playwright/test` at root; wire all test commands in `package.json` (see scripts below). Test infrastructure must be green before any feature work begins.
2. **SQLite schema + `TaskRepository`** — migration file + prepared statements + `TaskRepository.test.ts` written alongside
3. **Fastify routes + plugins** — JSON Schema validation + error handler + `taskRoutes.test.ts` written alongside
4. **`useTasks` hook + API client** — fetch wrappers + `useTasks.test.ts` written alongside
5. **React components** — `TaskInput`, `TaskList`, `TaskItem`, `ErrorBoundary`, loading/empty/error states + co-located `.test.tsx` files written alongside each component
6. **E2E tests** — Playwright spec files for all 4 core journeys (full stack must be running)
7. **Containerization** — Dockerfiles + docker-compose.yml + GitHub Actions CI

**`package.json` test scripts (all three levels):**

```json
// root package.json
{
  "scripts": {
    "test": "npm run test --workspaces",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "lint": "npm run lint --workspaces"
  }
}
```

```json
// client/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "lint": "eslint src --ext .ts,.tsx"
  }
}
```

```json
// server/package.json
{
  "scripts": {
    "test": "node --test",
    "test:watch": "node --test --watch",
    "lint": "eslint src --ext .ts"
  }
}
```

---

## Implementation Patterns & Consistency Rules

**Critical conflict points identified: 5 areas** where AI agents could diverge without explicit rules.

---

### Naming Patterns

#### Database Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| Table names | `snake_case` plural | `tasks` |
| Column names | `snake_case` | `created_at`, `user_id` |
| Primary key | `id` | `id INTEGER PRIMARY KEY AUTOINCREMENT` |
| Nullable foreign key | `{entity}_id` | `user_id INTEGER NULL` |
| Boolean columns | `INTEGER` (0/1) — SQLite has no BOOLEAN | `completed INTEGER DEFAULT 0` |

**Anti-pattern:** Using camelCase in SQL (`createdAt`, `userId`) — breaks SQL tooling and standard SQL readability.

#### API / JSON Field Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| All JSON fields in request/response bodies | `camelCase` | `{ "createdAt": 1714167600000, "isCompleted": false }` |
| Route path segments | `kebab-case` noun plural | `/api/tasks` |
| Route parameters | `:camelCase` | `:id` (single-word so no issue here) |
| Query parameters | `camelCase` | `?sortBy=createdAt` |

**Repository mapping rule:** The `TaskRepository` maps DB `snake_case` columns → JS `camelCase` in every `SELECT` result. No caller outside the repository ever sees `snake_case` field names.

**Anti-pattern:** Returning raw SQLite row objects (with `created_at`) directly from route handlers.

#### Code / File Naming Conventions

| Element | Convention | Example |
|---------|------------|---------|
| React components | `PascalCase` file + export | `TaskItem.tsx`, `export function TaskItem` |
| React hooks | `camelCase` prefixed `use` | `useTasks.ts`, `useTaskForm.ts` |
| Server route modules | `camelCase` + `Routes` suffix | `taskRoutes.ts` |
| Repository modules | `PascalCase` + `Repository` suffix | `TaskRepository.ts` |
| Utility / helper files | `camelCase` | `dateUtils.ts`, `errorHelpers.ts` |
| Test files | Same name as source + `.test.` | `TaskItem.test.tsx`, `taskRoutes.test.ts` |
| Type definition files | `camelCase` | `types.ts` |
| Environment files | `.env`, `.env.example` | — |

---

### Structure Patterns

#### Test File Location

**Rule: co-located test files** — test file lives in the same directory as the source file it tests.

```
client/src/components/TaskItem.tsx
client/src/components/TaskItem.test.tsx   ← co-located

client/src/hooks/useTasks.ts
client/src/hooks/useTasks.test.ts         ← co-located

server/routes/taskRoutes.ts
server/routes/taskRoutes.test.ts      ← co-located
```

**Exception:** Playwright E2E tests live in `e2e/` at monorepo root — they are not co-located because they test the full stack, not individual modules.

**Anti-pattern:** A separate `__tests__/` or `test/` folder inside `src/` for unit/component tests.

#### Shared Types Location

**Rule: single source of truth in `shared/types.ts`** at monorepo root, imported by both client and server.

```
todo-app/
├── shared/
│   └── types.ts       ← Task interface lives here
├── client/src/
│   └── (imports from ../../shared/types)
├── server/
│   └── (imports from ../../shared/types)
```

**`shared/types.ts` owns:**
- `Task` interface (camelCase, matching API response shape) — includes `userId: number | null` (reserved for future auth, always `null` in v1)
- `CreateTaskPayload`, `UpdateTaskPayload` request body types
- HTTP error response type `ApiError`

**Anti-pattern:** Duplicating the `Task` type in `client/src/types.ts` AND `server/types/` independently — they will diverge.

---

### Format Patterns

#### API Response Formats

**Success — return the resource or array directly (no wrapper envelope):**

```json
// GET /api/tasks
[{ "id": 1, "text": "Buy milk", "completed": false, "createdAt": 1714167600000, "userId": null }]

// POST /api/tasks → 201
{ "id": 2, "text": "Call dentist", "completed": false, "createdAt": 1714167700000, "userId": null }

// PATCH /api/tasks/:id → 200
{ "id": 2, "text": "Call dentist", "completed": true, "createdAt": 1714167700000, "userId": null }

// DELETE /api/tasks/:id → 204 (no body)
```

**Error — always `{ statusCode, error, message }`:**

```json
// 400 Validation
{ "statusCode": 400, "error": "Bad Request", "message": "body/text must be a non-empty string" }

// 404 Not Found
{ "statusCode": 404, "error": "Not Found", "message": "Task 99 not found" }

// 500 Internal
{ "statusCode": 500, "error": "Internal Server Error", "message": "An unexpected error occurred" }
```

**Anti-pattern:** Wrapping success responses in `{ data: [...], success: true }` — adds indirection with no benefit at this scale.

#### Date / Time Format

| Context | Format | Example |
|---------|--------|---------|
| SQLite storage (`created_at`) | Unix milliseconds INTEGER | `1714167600000` |
| API JSON (`createdAt`) | Unix milliseconds number | `1714167600000` |
| UI display | `Intl.DateTimeFormat` in component | `"27 Apr 2026"` |

**Rationale:** Integer timestamps are sortable, timezone-neutral, and trivially comparable — no ISO string parsing edge cases.

**Anti-pattern:** Storing ISO strings in SQLite (`"2026-04-27T10:00:00Z"`) or mixing timestamp formats between DB and API.

---

### Communication Patterns

#### Async State Shape in `useTasks`

**Rule: simple boolean flags** — two orthogonal flags, not a status enum.

```typescript
interface TasksState {
  tasks: Task[];
  isLoading: boolean;
  error: string | null;
}
```

**Loading flag rule:** `isLoading` is `true` only during the initial fetch. Individual mutation operations (create/toggle/delete) use optimistic UI — they do NOT set `isLoading = true`.

**`error` field rule:** Set to a user-facing string on failure; reset to `null` on the next successful operation of the same type. Never expose raw `Error.message` from fetch — use a mapped message.

**Anti-pattern:** A single `status: 'idle' | 'loading' | 'success' | 'error'` enum — cannot represent "data loaded but a mutation errored" simultaneously.

#### Optimistic UI Pattern

All three mutation operations (create, toggle, delete) follow the same 3-step pattern:

```
1. Apply change to local state immediately (no waiting)
2. Fire API call
3a. On success: update local state with server response (or no-op if already correct)
3b. On failure: roll back local state to pre-mutation snapshot + set error message
```

Rollback snapshots are captured as a local `const previous = tasks` before applying the optimistic update.

---

### Process Patterns

#### Error Handling

| Layer | Rule |
|-------|------|
| Server — unhandled exception | Fastify default error handler → `{ statusCode: 500, error, message: 'An unexpected error occurred' }` — no stack trace |
| Server — validation failure | Fastify JSON Schema → automatic 400 with field path |
| Server — not found | `@fastify/sensible` `reply.notFound('Task X not found')` |
| Client — fetch error | Catch in `useTasks` → set `error` string; do NOT propagate to `<ErrorBoundary>` (recoverable) |
| Client — render crash | `<ErrorBoundary>` at app root catches; renders fallback UI (FR28) |
| Client — error messages | Always user-facing strings, never raw `Error.message` or API `message` from 500s |

**Anti-pattern:** `console.error` in route handlers without also returning a structured error response.

#### Loading State Handling

| State | Rule |
|-------|------|
| Initial data fetch | Show skeleton / spinner while `isLoading === true` |
| Mutations (optimistic) | No spinner — changes appear immediately |
| Empty state (0 tasks, not loading) | Show empty-state message (FR24) |
| Error state | Show inline error banner; keep existing task list visible if available (NFR16 — partial functionality) |

#### Logging Levels (Pino / Fastify)

| Level | When to use |
|-------|-------------|
| `error` | Unhandled exceptions, DB errors |
| `warn` | 4xx responses from client validation failures |
| `info` | Default Fastify request lifecycle logs (automatic) |
| `debug` | Development-only; disabled (`level: 'info'`) in production |

---

### Enforcement Guidelines

**All AI agents MUST:**

- Use `snake_case` in all SQL (table names, column names, index names)
- Use `camelCase` in all TypeScript interfaces, React props, and JSON API fields
- Import `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, and `ApiError` from `shared/types.ts` — never redefine them
- Place test files co-located with their source file (`Foo.test.ts` next to `Foo.ts`)
- Return API errors as `{ statusCode, error, message }` — never expose stack traces or internal DB messages
- Store and transmit dates as Unix milliseconds (number) — never ISO strings
- Apply the 3-step optimistic UI pattern (snapshot → update → rollback on failure) for create, toggle, and delete
- Use `isLoading` + `error` boolean/string flags in `useTasks` — do not introduce a `status` enum
- Resolve all types via `shared/types.ts` before creating new type files

**Pattern violations to flag in code review:**

- camelCase column name in any `.sql` file or `better-sqlite3` query string
- `{ data: ..., success: ... }` wrapper in any API response
- ISO date string (`"2026-04-27"`) in any DB column or API field
- Duplicate `Task` interface in client or server (not imported from `shared/`)
- Test file inside a `__tests__/` folder under `src/`

---

## Project Structure & Boundaries

### Requirements to Structure Mapping

| FR Category | Directory / File |
|-------------|------------------|
| Task Management (FR1–5) | `client/src/hooks/useTasks.ts` + `server/routes/taskRoutes.ts` |
| Task List Display (FR6–10) | `client/src/components/TaskList.tsx`, `TaskItem.tsx` |
| Application States (FR11–15) | `client/src/components/TaskList.tsx` (conditional render branches) |
| Data Persistence (FR16–19) | `server/repositories/TaskRepository.ts` + `server/migrations/` |
| Accessibility & Navigation (FR20–24) | Every component + `client/src/App.tsx` (React Router) |
| App Infrastructure (FR25–31) | `shared/types.ts`, `e2e/`, `client/vite.config.ts`, `.github/workflows/` |

---

### Complete Project Directory Structure

```
todo-app/
├── package.json                        # npm workspaces root — workspaces: ["client", "server"]
├── README.md
├── .gitignore                          # ignores: *.db, .env*, dist/, node_modules/
├── tsconfig.base.json                  # shared TS strict config — extended by both workspaces
├── .eslintrc.base.js                   # shared ESLint + typescript-eslint rules
│
├── shared/
│   └── types.ts                        # Task, CreateTaskPayload, UpdateTaskPayload, ApiError
│
├── e2e/                                # Playwright E2E — monorepo root
│   ├── playwright.config.ts            # webServer: starts client dev server + server
│   ├── fixtures/
│   │   └── index.ts                    # shared test fixtures / page objects
│   └── tests/
│       ├── createTask.spec.ts          # Journey 1: create → appears in active list
│       ├── completeTask.spec.ts        # Journey 2: toggle → strikethrough
│       ├── deleteTask.spec.ts          # Journey 3: delete → removed from list
│       └── apiFailure.spec.ts          # Journey 4: API error → inline error state
│
├── .github/
│   └── workflows/
│       ├── ci.yml                      # lint + unit tests on every push to every branch
│       └── e2e.yml                     # Playwright on push to main only
│
├── client/
│   ├── package.json                    # react, react-dom, react-router, vitest, @testing-library/react
│   ├── tsconfig.json                   # extends ../../tsconfig.base.json
│   ├── .eslintrc.js                    # extends ../../.eslintrc.base.js
│   ├── vite.config.ts                  # Vite dev server + Vitest config
│   ├── index.html
│   └── src/
│       ├── main.tsx                    # React DOM render entry point + BrowserRouter
│       ├── App.tsx                     # Route definitions (single route '/')
│       ├── api/
│       │   └── tasksApi.ts             # fetch wrappers: getTasks, createTask, updateTask, deleteTask
│       ├── hooks/
│       │   ├── useTasks.ts             # state: { tasks, isLoading, error } + CRUD operations
│       │   └── useTasks.test.ts        # unit tests — mocks tasksApi
│       ├── components/
│       │   ├── TaskInput.tsx           # Controlled input + submit button (FR1)
│       │   ├── TaskInput.test.tsx
│       │   ├── TaskList.tsx            # Active + Completed groups; loading / empty / error render branches
│       │   ├── TaskList.test.tsx
│       │   ├── TaskItem.tsx            # Checkbox toggle + delete button + ARIA attrs
│       │   ├── TaskItem.test.tsx
│       │   ├── ErrorBoundary.tsx       # Class component; catches render crashes (FR28, NFR17)
│       │   └── ErrorBoundary.test.tsx
│       ├── pages/
│       │   └── HomePage.tsx            # Composes TaskInput + TaskList
│       └── styles/
│           └── index.css               # Global reset + CSS custom properties (design tokens)
│
└── server/
    ├── package.json                    # fastify, better-sqlite3, @fastify/cors, @fastify/sensible, pino-pretty
    ├── tsconfig.json                   # extends ../../tsconfig.base.json
    ├── .eslintrc.js                    # extends ../../.eslintrc.base.js
    ├── .env.example                    # PORT=3000, DATABASE_PATH=./data/todo.db, CORS_ORIGIN=http://localhost:5173
    ├── app.ts                          # Fastify app factory — registers plugins + routes; exported for tests
    ├── server.ts                       # Entry point: build app, listen on PORT
    ├── data/
    │   └── .gitkeep                    # Empty dir tracked in git; todo.db is gitignored
    ├── migrations/
    │   └── 001_create_tasks.sql        # CREATE TABLE tasks (...); run once at startup
    ├── plugins/
    │   ├── db.ts                       # Fastify plugin: opens SQLite + WAL pragma, decorates fastify.db
    │   ├── cors.ts                     # @fastify/cors — reads CORS_ORIGIN from env
    │   └── errorHandler.ts             # Custom setErrorHandler — returns { statusCode, error, message } only
    ├── repositories/
    │   ├── TaskRepository.ts           # All SQL via prepared statements; maps snake_case → camelCase
    │   └── TaskRepository.test.ts      # Unit tests — opens in-memory SQLite
    ├── routes/
    │   ├── taskRoutes.ts               # GET /api/tasks, POST, PATCH /:id, DELETE /:id
    │   ├── taskRoutes.test.ts          # node:test — mocks TaskRepository
    │   └── schemas/
    │       └── taskSchemas.ts          # Fastify JSON Schema for request bodies + params
    └── types/
        └── fastify.d.ts                # Module augmentation: FastifyInstance decorated with `db`
```

---

### Architectural Boundaries

#### API Boundary (client ↔ server)

- **Entry point (client side):** `client/src/api/tasksApi.ts` — the only file that calls `fetch`. All calls go to `VITE_API_URL/api/tasks`.
- **Entry point (server side):** `server/routes/taskRoutes.ts` — the only file that registers HTTP handlers.
- **Contract:** `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError` in `shared/types.ts`. Both sides import from here — no independent type definitions.
- **Rule:** No component or hook other than `useTasks` may call `tasksApi` directly.

#### Data Boundary (routes ↔ database)

- **Only `TaskRepository.ts` reads from or writes to SQLite.** Route handlers call repository methods and receive typed `Task` objects.
- **Repository responsibility:** execute prepared statements, translate `snake_case` DB rows to `camelCase` `Task` objects, throw errors that the route error handler can serialise.
- **Rule:** No SQL strings outside `TaskRepository.ts` and `migrations/`.

#### State Boundary (hook ↔ components)

- **`useTasks`** is the single source of truth for task state in the frontend.
- **Components** call `useTasks()` to read state and trigger mutations. They never import from `tasksApi` directly.
- **`ErrorBoundary`** handles React render crashes (uncaught exceptions). The `error: string | null` from `useTasks` handles fetch/API errors — these are two independent mechanisms.

#### Test Boundary

- **Unit tests (Vitest / node:test):** mock at their own boundary.
  - Hook tests mock `tasksApi`.
  - Route tests mock `TaskRepository`.
  - Repository tests use an in-memory SQLite database (no mocking).
- **E2E tests (Playwright):** no mocks — test the fully running stack via browser.

---

### Integration Points

#### Internal Data Flow

```
Browser
  └─ React component renders
       └─ useTasks hook provides { tasks, isLoading, error }
            └─ tasksApi.ts calls fetch(VITE_API_URL/api/tasks)
                 └─ Fastify route handler (taskRoutes.ts)
                      └─ TaskRepository.ts executes prepared statement
                           └─ SQLite (server/data/todo.db)
```

#### Environment Configuration

| Variable | Where | Value (dev) |
|----------|-------|-------------|
| `VITE_API_URL` | client `.env` | `http://localhost:3000` |
| `PORT` | server `.env` | `3000` |
| `DATABASE_PATH` | server `.env` | `./data/todo.db` |
| `CORS_ORIGIN` | server `.env` | `http://localhost:5173` |

#### Deployment Integration Points

- **Docker Compose** orchestrates `client` (nginx) and `server` (Node.js) containers on a shared network; a named volume persists the SQLite database at `server/data/`; `VITE_API_URL` is baked into the client build and points to the server container.
- **Health checks**: Backend exposes `GET /api/healthz` returning `{ "status": "ok" }` (200) or `{ "status": "error" }` (503); both Dockerfiles include `HEALTHCHECK` instructions.
- **Compose profiles**: `dev` profile mounts source volumes for hot-reload; `test` profile runs the test suite in containers.
- **GitHub Actions** runs `npm test --workspaces` (unit) on all pushes; Playwright E2E on `main` using `playwright.config.ts` `webServer` to start both services locally.

---

## Architecture Validation Results

### Coherence Validation ✅

**Technology compatibility — all decisions work together without conflicts:**

| Pair | Status | Notes |
|------|--------|-------|
| Vite 6 + Vitest | ✅ | Native integration via `vite.config.ts`; single config file for both |
| Fastify v5 + `@fastify/cors` + `@fastify/sensible` | ✅ | All packages v5-compatible |
| `better-sqlite3` 12.9.0 + Node.js sync API | ✅ | Synchronous API is correct for single-user containerized deployment |
| React Router 7.14.2 + React 18 | ✅ | React Router v7 targets React 18+ |
| Playwright 1.59.1 + `webServer` monorepo config | ✅ | Standard Playwright multi-server pattern |
| TypeScript strict + `shared/types.ts` + `@shared/*` path alias | ✅ | Single source of truth resolves uniformly in both workspaces |

**Pattern consistency — all conventions self-consistent:**
- `snake_case` DB → `camelCase` TS mapping is single-responsibility in `TaskRepository` ✅
- `shared/types.ts` is consistently referenced by both client and server — no independent type redefinitions ✅
- Co-located test files are consistent with Vitest and `node:test` conventions ✅
- `useTasks` → `tasksApi` → `fetch` boundary is clean ✅
- Error response shape `{ statusCode, error, message }` is consistent across Fastify error handler, route handlers, and `ApiError` type ✅

**Structure alignment — project structure supports all architectural decisions:**
- Monorepo with two npm workspaces maps directly to separate `client/` and `server/` directories ✅
- `shared/` directory resolves the type contract without a third workspace ✅
- Plugin-first Fastify architecture maps to `plugins/`, `routes/`, `repositories/` ✅
- E2E at monorepo root correctly sits above both workspaces ✅

---

### Requirements Coverage Validation ✅

**All 31 FRs architecturally supported:**

| FR Category | Coverage |
|-------------|----------|
| Task Management (FR1–5) | `useTasks` hook + `taskRoutes.ts` + `TaskRepository.ts` |
| Task List Display (FR6–10) | `TaskList.tsx` + `TaskItem.tsx` conditional render branches |
| Application States (FR11–15) | `isLoading`/`error` flags in `useTasks`; empty/error/loading UI in `TaskList` |
| Data Persistence (FR16–19) | SQLite schema + WAL mode + prepared statements in `TaskRepository` |
| Accessibility & Navigation (FR20–24) | ARIA attrs on every interactive component; a11y baked in from day 1 |
| App Infrastructure (FR25–31) | React Router, `ErrorBoundary`, Vitest ≥80%, ESLint, Playwright E2E, GitHub Actions |

**All 17 NFRs architecturally covered:**

| NFR Category | Coverage |
|--------------|---------|
| Performance (NFR1–5) | Optimistic UI (no wait on mutations); Vite build optimisation; SQLite sync API |
| Security (NFR6–9) | CORS plugin; error handler (no stack traces); JSON Schema validation; payload size limit |
| Accessibility (NFR10–14) | ARIA strategy documented as cross-cutting; keyboard nav in component design |
| Reliability (NFR15–17) | No silent failures (all errors caught in `useTasks`); partial functionality (error banner + existing list); `ErrorBoundary` |

---

### Gap Analysis & Resolution

**1 important gap identified and resolved:**

**Gap: `shared/types.ts` TypeScript import path resolution**  
Without explicit configuration, different agents would use different relative import paths (`../../shared/types`, `../../../shared/types`, etc.).

**Resolution — `@shared/*` path alias in `tsconfig.base.json`:**

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "paths": {
      "@shared/*": ["../../shared/*"]
    }
  }
}
```

Both `client/tsconfig.json` and `server/tsconfig.json` extend this base. All agents must use `import { Task } from '@shared/types'` — no relative paths to `shared/`.

**Note for Vite:** Add the alias to `vite.config.ts` as well (Vite resolves paths independently of `tsc`):

```typescript
// vite.config.ts
resolve: {
  alias: { '@shared': path.resolve(__dirname, '../../shared') }
}
```

**2 minor notes (non-blocking):**

- `fastify-cli generate` creates a `server/test/` directory by default. Implementation agents should delete it — tests are co-located per the patterns defined in step-05.
- Client `.env` file (containing `VITE_API_URL`) must be listed in `.gitignore` alongside server `.env`. Both `.env` files have `.env.example` counterparts tracked in git.

---

### Implementation Readiness Checklist

**Requirements Analysis**
- [x] Project context thoroughly analysed (31 FRs / 17 NFRs across 6 + 4 categories)
- [x] Scale and complexity assessed (low: single entity, single user, no auth, no real-time)
- [x] Technical constraints identified and respected
- [x] Cross-cutting concerns mapped to specific layers

**Architectural Decisions**
- [x] Critical decisions documented with exact versions
- [x] Technology stack fully specified (React 18, Vite 6, React Router 7.14.2, Fastify v5, better-sqlite3 12.9.0, Playwright 1.59.1)
- [x] Integration patterns defined (REST, no envelope, `{ statusCode, error, message }` errors)
- [x] Performance constraints addressed (optimistic UI, sync SQLite, Vite build)
- [x] Security constraints addressed (CORS, error serialiser, JSON Schema, payload limits)

**Implementation Patterns**
- [x] Naming conventions established (snake_case DB, camelCase TS/JSON, PascalCase components)
- [x] Structure patterns defined (co-located tests, `shared/types.ts`, `@shared/*` alias)
- [x] Communication patterns specified (`useTasks` state shape, optimistic UI rollback)
- [x] Process patterns documented (error handling layers, loading states, Pino log levels)
- [x] Anti-patterns documented for all major conflict zones

**Project Structure**
- [x] Complete directory tree defined with every file named and annotated
- [x] Component boundaries established (API / data / state / test boundaries)
- [x] Integration points mapped (data flow, env config, deployment)
- [x] Requirements-to-structure mapping complete

---

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level: High**

**Key strengths:**
- Every architectural decision has an explicit rationale tied to a specific FR or NFR
- All conflict zones where AI agents could diverge are resolved with concrete rules and anti-patterns
- The `shared/types.ts` + `@shared/*` pattern eliminates the most common cross-workspace drift
- The optimistic UI rollback pattern and error handling layers are fully specified — no agent interpretation required
- Implementation sequence is unambiguous

**Areas deferred to post-MVP (by design):**
- Authentication (user_id reserved but not surfaced)
- Database migration runner (manual SQL files are sufficient for single-table v1)
- Rate limiting (single user)
- Monitoring beyond Docker health checks and compose logs
