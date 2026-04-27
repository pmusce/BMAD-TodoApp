---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
status: complete
completedDate: '2026-04-27'
inputDocuments:
  - _bmad-output/planning-artifacts/prd.md
  - _bmad-output/planning-artifacts/architecture.md
---

# Todo App - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Todo App, decomposing the requirements from the PRD and Architecture requirements into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: User can create a task by providing a text description and submitting it
FR2: User can mark an active task as complete
FR3: User can reverse a completed task back to active
FR4: User can permanently delete a task
FR5: User receives immediate UI feedback for create, complete, and delete operations (optimistic updates — UI reflects change before API confirms)
FR6: User can view all tasks in a single list grouped into active and completed sections
FR7: User sees active tasks displayed before completed tasks
FR8: User sees completed tasks visually distinguished (strikethrough treatment)
FR9: User sees tasks within each group ordered reverse-chronologically
FR10: User sees the creation time of each task expressed as a human-readable relative label (e.g. "2 hours ago")
FR11: User is shown a meaningful empty state when no tasks exist
FR12: User is shown a loading indicator during any async operation
FR13: User is shown an inline error state with a retry action when any task operation fails
FR14: User is shown a graceful degraded state when the application cannot reach the backend
FR15: No operation fails silently — every error surfaces a visible indicator to the user
FR16: System persists all task data via a REST API backend
FR17: System exposes create, read, update (completion toggle), and delete endpoints for tasks
FR18: System returns consistent, structured JSON error responses for all API failures
FR19: Task data model includes a nullable `user_id` field (reserved for future auth; not surfaced in v1)
FR20: User can fully operate the application using keyboard only (Tab, Enter, Space, Delete)
FR21: User can see a visible focus indicator on the currently focused element at all times
FR22: Keyboard focus returns to the task input field after a task is successfully created
FR23: All icon-only interactive elements have accessible text labels
FR24: User is notified of async operation status changes via accessible live region announcements
FR25: Application runs as a single-page application with client-side routing
FR26: Application renders correctly on viewports from 320px to 1440px wide
FR27: All interactive touch targets meet minimum size requirements for reliable touch input
FR28: Application handles uncaught runtime errors at the application boundary without a full crash
FR29: Developer can run the complete application locally in under 5 minutes following the README
FR30: Codebase passes ESLint validation with zero errors
FR31: Core business logic has automated test coverage of ≥80%

### NonFunctional Requirements

NFR1: UI interactions (create, toggle, delete) must complete and reflect in the interface within 300ms of user action
NFR2: Initial application load must complete within 1.5 seconds on a standard broadband connection
NFR3: API responses must be returned by the server within 200ms for all task CRUD operations under normal load
NFR4: Cumulative Layout Shift (CLS) score must remain below 0.1 throughout all user interactions
NFR5: The application must not block the main thread during task list rendering, regardless of task count within normal single-user usage
NFR6: All client-server communication must use HTTPS in production
NFR7: The API must not expose internal error details (stack traces, database errors) in HTTP responses — all errors return a structured JSON envelope only
NFR8: No sensitive data (passwords, tokens, PII) is stored in v1; the nullable `user_id` field must not be writable via the public API in v1
NFR9: API endpoints must validate and reject malformed or oversized request payloads
NFR10: All interactive elements must be reachable and operable via keyboard alone
NFR11: All interactive elements must have a visible focus indicator meeting a minimum contrast ratio of 3:1 against adjacent colours
NFR12: All images and icon-only controls must have programmatic text alternatives
NFR13: Async status changes must be announced to screen readers via ARIA live regions without requiring user action
NFR14: The application must not violate any WCAG 2.1 Level A success criteria
NFR15: Every API error — including network timeouts and 5xx responses — must result in a visible, non-dismissible error state with a retry action; no silent failures
NFR16: The application must remain partially functional (display cached/last-known state) when the backend is unreachable, rather than crashing or showing a blank screen
NFR17: Uncaught client-side runtime errors must be caught at the application error boundary and display a recoverable error state rather than an unhandled exception

### Additional Requirements

- Starter template: Frontend initialized with `npm create vite@latest client -- --template react-ts` (Vite 6, React 18, TypeScript strict)
- Starter template: Backend initialized with `fastify generate server --lang=ts` via fastify-cli (Fastify v5, TypeScript, Pino logging)
- Monorepo structure: single repo with npm workspaces — `client/` and `server/` workspaces under a root `package.json`
- Shared types: `shared/types.ts` at monorepo root exports `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError`; imported via `@shared/*` path alias by both workspaces
- Test infrastructure bootstrapped in step 1 alongside scaffold: Vitest + React Testing Library (client), Node.js `node:test` (server), Playwright (e2e at root)
- Co-located test files: every source file has a sibling `.test.ts(x)` file in the same directory
- ESLint: unified config via `.eslintrc.base.js` extended by both `client/.eslintrc.js` and `server/.eslintrc.js`; typescript-eslint rules applied from day 1
- GitHub Actions CI: lint + unit tests on every push to every branch; Playwright E2E on push to `main` only
- Deployment: Vercel (frontend SPA) + Railway (backend with persistent SQLite volume)
- Environment config: `.env` gitignored; `VITE_API_URL` on client; `PORT`, `DATABASE_PATH`, `CORS_ORIGIN` on server — `.env.example` counterparts tracked in git
- SQLite database: `better-sqlite3` v12.9.0, WAL mode, raw SQL prepared statements, schema migrations via `server/migrations/001_create_tasks.sql`
- Fastify plugins: `@fastify/cors`, `@fastify/sensible`, custom error handler returning `{ statusCode, error, message }` only
- Delete `server/test/` directory generated by fastify-cli (tests are co-located per architecture patterns)

### UX Design Requirements

N/A — no UX Design document for this project.

### FR Coverage Map

FR1: Epic 3 - Create task via UI
FR2: Epic 3 - Mark task complete
FR3: Epic 3 - Reverse completed task
FR4: Epic 3 - Delete task
FR5: Epic 3 - Optimistic UI feedback
FR6: Epic 3 - Grouped task list view
FR7: Epic 3 - Active tasks before completed
FR8: Epic 3 - Strikethrough on completed tasks
FR9: Epic 3 - Reverse-chronological ordering
FR10: Epic 3 - Relative timestamp display
FR11: Epic 3 - Empty state
FR12: Epic 3 - Loading indicator
FR13: Epic 3 - Inline error state with retry
FR14: Epic 3 - Graceful degraded state
FR15: Epic 3 - No silent failures
FR16: Epic 2 - REST API backend persistence
FR17: Epic 2 - CRUD endpoints
FR18: Epic 2 - Consistent JSON error responses
FR19: Epic 2 - Nullable user_id in schema
FR20: Epic 3 - Keyboard-only operability
FR21: Epic 3 - Visible focus indicators
FR22: Epic 3 - Focus returns to input post-create
FR23: Epic 3 - Accessible labels on icon-only controls
FR24: Epic 3 - ARIA live regions for async status
FR25: Epic 1 (shell) + Epic 3 (complete) - SPA routing
FR26: Epic 3 - Responsive layout 320px–1440px
FR27: Epic 3 - Touch target sizes
FR28: Epic 3 - ErrorBoundary
FR29: Epic 1 (local setup scaffolded) + Epic 4 (deployment + README finalized)
FR30: Epic 1 (configured) + ongoing across all epics - ESLint clean
FR31: Epic 1 (infra) + Epics 2 & 3 (unit tests) + Epic 4 (E2E + ≥80% verification)

## Epic List

### Epic 1: Project Foundation & Developer Experience
A developer can clone the monorepo, install all dependencies, and run the full-stack application locally with TypeScript, ESLint, and all test runners (Vitest, node:test, Playwright) green — scaffold only, no feature code.
**FRs covered:** FR25 (SPA routing shell), FR29 (local setup), FR30 (ESLint configured), FR31 (test infrastructure)

### Epic 2: Task REST API & Data Layer
A developer can perform full CRUD on tasks via the REST API — all 4 endpoints operational, data persisting in SQLite, consistent JSON error responses, and schema validation enforced.
**FRs covered:** FR16, FR17, FR18, FR19
**NFRs covered:** NFR3, NFR6 (HTTPS-ready), NFR7, NFR8, NFR9

### Epic 3: Task Management Frontend
A user can create, complete, reverse, and delete tasks in the browser — with immediate optimistic feedback, a grouped/ordered/timestamped list, all application states (loading, empty, error, degraded), full keyboard accessibility, and a responsive layout across all target viewports.
**FRs covered:** FR1–FR15, FR20–FR28
**NFRs covered:** NFR1, NFR2, NFR4, NFR5, NFR10–NFR17

### Epic 4: Quality Gates & Production Deployment
The complete application is validated by a Playwright E2E suite covering all 4 user journeys, passes automated CI on every push, and is deployed to production (Vercel + Railway) with a README that communicates architectural decisions.
**FRs covered:** FR29 (deployment + README finalized), FR31 (≥80% coverage verified + E2E suite)
**NFRs covered:** NFR6 (HTTPS in production)

---

## Epic 1: Project Foundation & Developer Experience

A developer can clone the monorepo, install all dependencies, and run the full-stack application locally with TypeScript, ESLint, and all test runners (Vitest, node:test, Playwright) green — scaffold only, no feature code.

### Story 1.1: Monorepo Root Scaffold

As a developer,
I want a monorepo root with npm workspaces, shared TypeScript config, and shared ESLint config,
So that both workspaces share a single source of truth for TS and lint rules from day one.

**Acceptance Criteria:**

**Given** the root `package.json` is reviewed
**When** the developer reads it
**Then** it declares `"workspaces": ["client", "server"]` and scripts: `test` (runs workspaces), `lint` (runs workspaces), `test:e2e`, `test:e2e:ui`

**Given** `tsconfig.base.json` exists at the monorepo root
**When** the TypeScript compiler processes it
**Then** strict mode is enabled, module is `ESNext`, moduleResolution is `bundler`, and `paths` includes `"@shared/*": ["../../shared/*"]`

**Given** `.eslintrc.base.js` exists at the monorepo root
**When** reviewed
**Then** it configures `typescript-eslint` with recommended rules applicable to both workspaces

**Given** `.gitignore` exists at the monorepo root
**When** reviewed
**Then** it ignores `*.db`, `.env*`, `dist/`, `node_modules/`

**Given** `npm install` is run at the monorepo root
**When** completed without errors
**Then** workspace packages are linked and root `node_modules` contains shared devDependencies

---

### Story 1.2: Frontend Workspace Bootstrap

As a developer,
I want a Vite + React + TypeScript frontend workspace with Vitest configured and running,
So that I can start the dev server and run component tests from day one.

**Acceptance Criteria:**

**Given** `client/` is initialized via `npm create vite@latest client -- --template react-ts`
**When** the developer runs `npm run dev` in `client/`
**Then** the Vite dev server starts on port 5173 with no errors

**Given** `client/tsconfig.json` exists
**When** reviewed
**Then** it extends `../../tsconfig.base.json`

**Given** `client/vite.config.ts` configures Vitest
**When** the developer runs `npm run test` in `client/`
**Then** Vitest runs and exits with code 0 (no test files yet; runner is confirmed operational)

**Given** the `@shared` path alias is configured in `client/vite.config.ts`
**When** a source file imports `from '@shared/types'`
**Then** both Vite and TypeScript resolve it to `shared/types.ts` at the monorepo root

**Given** `react-router`, `vitest`, `@testing-library/react`, and `@testing-library/user-event` are installed
**When** `client/package.json` is reviewed
**Then** all four are present as dependencies or devDependencies

---

### Story 1.3: Backend Workspace Bootstrap

As a developer,
I want a Fastify + TypeScript backend workspace with node:test available,
So that I can start the API server and run server-side tests from day one.

**Acceptance Criteria:**

**Given** `server/` is initialized via `fastify generate server --lang=ts`
**When** the developer runs `npm run dev` in `server/`
**Then** the Fastify server starts on port 3000 with no errors and logs in pino-pretty format

**Given** the auto-generated `server/test/` directory was created by fastify-cli
**When** setup is complete
**Then** `server/test/` has been deleted (tests are co-located per architecture conventions)

**Given** `server/tsconfig.json` exists
**When** reviewed
**Then** it extends `../../tsconfig.base.json`

**Given** `better-sqlite3`, `@types/better-sqlite3`, `@fastify/cors`, `@fastify/sensible`, and `pino-pretty` are installed
**When** `server/package.json` is reviewed
**Then** all five are present as dependencies

**Given** `server/data/.gitkeep` exists and `server/migrations/` directory exists
**When** `.gitignore` is reviewed
**Then** `server/data/todo.db` is gitignored but `server/data/.gitkeep` is tracked

**Given** `server/.env.example` exists
**When** reviewed
**Then** it contains `PORT=3000`, `DATABASE_PATH=./data/todo.db`, `CORS_ORIGIN=http://localhost:5173`

**Given** `npm run test` is run in `server/` with no test files present
**When** `node --test` executes
**Then** it exits 0 (no tests is acceptable; runner is confirmed operational)

---

### Story 1.4: Shared Types Foundation

As a developer,
I want a `shared/types.ts` module exporting the core domain types,
So that client and server share a single, authoritative contract for the Task entity with no duplication.

**Acceptance Criteria:**

**Given** `shared/types.ts` exists at the monorepo root
**When** reviewed
**Then** it exports: `Task { id: number, text: string, completed: boolean, createdAt: number }`, `CreateTaskPayload { text: string }`, `UpdateTaskPayload { completed: boolean }`, `ApiError { statusCode: number, error: string, message: string }`

**Given** a file in `client/src/` contains `import type { Task } from '@shared/types'`
**When** TypeScript compiles the client workspace
**Then** no type errors are reported

**Given** a file in `server/src/` contains `import type { Task } from '@shared/types'`
**When** TypeScript compiles the server workspace
**Then** no type errors are reported

**Given** the entire codebase is searched for `interface Task` or `type Task`
**When** the search completes
**Then** no definition of `Task` exists anywhere except `shared/types.ts`

---

### Story 1.5: Playwright E2E Scaffold

As a developer,
I want a Playwright E2E scaffold at the monorepo root with stub spec files,
So that full-stack end-to-end tests can be written against the running stack once features are complete.

**Acceptance Criteria:**

**Given** `e2e/playwright.config.ts` exists
**When** reviewed
**Then** it defines `webServer` entries for both client (port 5173) and server (port 3000), sets `testDir` to `./tests`, and sets a reasonable `timeout`

**Given** `e2e/fixtures/index.ts` exists
**When** reviewed
**Then** it exports a test fixture extending Playwright's base `test` (stub is sufficient at this stage)

**Given** `e2e/tests/` contains stub spec files
**When** reviewed
**Then** `createTask.spec.ts`, `completeTask.spec.ts`, `deleteTask.spec.ts`, and `apiFailure.spec.ts` each exist with a placeholder `test.todo()` or empty describe block

**Given** `@playwright/test` 1.59.1 is installed as a root devDependency
**When** `npx playwright --version` is run at the monorepo root
**Then** it reports version 1.59.1 (or compatible)

---

### Story 1.6: GitHub Actions CI Configuration

As a developer,
I want GitHub Actions workflows that run lint and unit tests on every push and E2E tests on `main`,
So that automated quality gates enforce code standards before any code is merged.

**Acceptance Criteria:**

**Given** `.github/workflows/ci.yml` exists
**When** reviewed
**Then** it triggers on `push` to all branches, runs `npm ci` at root, `npm run lint --workspaces`, and `npm test --workspaces`

**Given** `.github/workflows/e2e.yml` exists
**When** reviewed
**Then** it triggers on `push` to `main` only, installs Playwright browsers via `npx playwright install --with-deps`, and runs `npm run test:e2e`

**Given** both workflow YAML files are parsed
**When** validated
**Then** no YAML syntax errors are present

**Given** the CI workflow is triggered by a push to a feature branch
**When** all lint and unit tests pass
**Then** the `ci.yml` workflow reports success and the `e2e.yml` workflow does NOT trigger

---

## Epic 2: Task REST API & Data Layer

### Story 2.1: SQLite Schema & TaskRepository

As a developer,
I want a SQLite database initialized with the tasks schema and a `TaskRepository` class wrapping all queries,
So that all data access is centralised, type-safe, and the only place in the codebase that contains SQL.

**Acceptance Criteria:**

**Given** `server/migrations/001_create_tasks.sql` exists
**When** reviewed
**Then** it contains `CREATE TABLE IF NOT EXISTS tasks` with columns: `id INTEGER PRIMARY KEY AUTOINCREMENT`, `text TEXT NOT NULL`, `completed INTEGER DEFAULT 0`, `created_at INTEGER NOT NULL`, `user_id INTEGER NULL`

**Given** `TaskRepository.ts` exists in `server/src/repositories/`
**When** reviewed
**Then** it exposes `findAll()`, `create(payload)`, `update(id, patch)`, and `delete(id)` methods using `better-sqlite3` prepared statements

**Given** `TaskRepository` executes a `SELECT`
**When** rows are returned
**Then** all `snake_case` DB column names are mapped to their `camelCase` TypeScript equivalents (`created_at` → `createdAt`, `user_id` → `userId`) before being returned to callers

**Given** `TaskRepository.test.ts` exists co-located with `TaskRepository.ts`
**When** run via `node --test`
**Then** it passes 6 test cases covering: `findAll` returns empty array initially, `create` inserts and returns a Task, `findAll` returns created task, `update` toggles completed, `update` on missing id returns undefined, `delete` removes the task

**Given** the Fastify app initialises the database plugin
**When** the SQLite connection is opened
**Then** `db.pragma('journal_mode = WAL')` is executed before any queries

---

### Story 2.2: Fastify Plugins (DB, CORS, Error Handler)

As a developer,
I want the Fastify app factory to register the database plugin, CORS plugin, and custom error handler,
So that every route has access to the database and all errors return a consistent, safe JSON shape.

**Acceptance Criteria:**

**Given** `server/src/plugins/db.ts` exists
**When** the plugin is registered
**Then** it opens `better-sqlite3` at `DATABASE_PATH` env variable, runs the migration SQL, enables WAL mode, and decorates the Fastify instance with `fastify.db`

**Given** `server/src/plugins/cors.ts` exists
**When** the plugin is registered
**Then** it registers `@fastify/cors` with `origin` read from the `CORS_ORIGIN` environment variable

**Given** `server/src/plugins/errorHandler.ts` exists
**When** any route throws or rejects
**Then** the response body contains only `{ statusCode, error, message }` — no stack traces, no internal DB error details

**Given** `server/src/types/fastify.d.ts` exists
**When** TypeScript compiles
**Then** `FastifyInstance` is augmented with `db: Database` from `better-sqlite3` with zero type errors

**Given** `server/src/app.ts` exports an async factory function
**When** called in tests
**Then** it builds the Fastify instance and registers all plugins and routes without starting an HTTP listener

---

### Story 2.3: Task Route Handlers with JSON Schema Validation

As a developer,
I want four task route handlers registered at `/api/tasks` with JSON Schema validation on all inputs,
So that the API enforces valid payloads at the boundary and returns appropriate HTTP status codes.

**Acceptance Criteria:**

**Given** `GET /api/tasks` is called
**When** the database contains tasks
**Then** the response is `200` with a JSON array of `Task` objects in `camelCase`

**Given** `POST /api/tasks` is called with `{ "text": "Buy milk" }`
**When** the text is non-empty
**Then** the response is `201` with the created `Task` object

**Given** `PATCH /api/tasks/:id` is called with a valid id and `{ "completed": true }`
**When** the task exists
**Then** the response is `200` with the updated `Task` object

**Given** `PATCH /api/tasks/:id` is called with an id that does not exist
**When** `TaskRepository.update` returns `undefined`
**Then** the response is `404` with `{ "statusCode": 404, "error": "Not Found", "message": "Task <id> not found" }`

**Given** `DELETE /api/tasks/:id` is called with a valid id
**When** the task exists
**Then** the response is `204` with no response body

**Given** `POST /api/tasks` is called with `{ "text": "" }` or `{ "text": "   " }`
**When** JSON Schema validation runs
**Then** the response is `400` with `{ "statusCode": 400, "error": "Bad Request", "message": "..." }`

**Given** `server/src/routes/schemas/taskSchemas.ts` exists
**When** reviewed
**Then** it defines JSON Schema objects for: POST body (`text` required, non-empty string), PATCH body (`completed` required boolean), route params (`id` required integer) — and `user_id` does NOT appear in any request body schema

---

### Story 2.4: Server Route Unit Tests

As a developer,
I want unit tests for all four task route handlers that mock `TaskRepository`,
So that route logic is verified without a live database.

**Acceptance Criteria:**

**Given** `server/src/routes/taskRoutes.test.ts` exists co-located with `taskRoutes.ts`
**When** run via `node --test`
**Then** it passes 7 test cases: `GET /api/tasks` → 200 + array, `POST /api/tasks` valid → 201 + Task, `POST /api/tasks` invalid text → 400, `PATCH /api/tasks/:id` valid → 200 + Task, `PATCH /api/tasks/:id` missing → 404, `DELETE /api/tasks/:id` → 204, error handler returns correct shape

**Given** the test file runs
**When** tests execute
**Then** no real SQLite file is opened — `TaskRepository` is stubbed/mocked via dependency injection or module replacement

**Given** the full server test suite is run
**When** all 7 route tests pass
**Then** total elapsed time is well under 1 second (no I/O latency from real DB)

---

## Epic 3: Task Management Frontend

### Story 3.1: Tasks API Client

As a developer,
I want a dedicated `tasksApi.ts` module that wraps all `fetch` calls to the backend,
So that every HTTP detail is centralised in one file and no other module ever calls `fetch` directly.

**Acceptance Criteria:**

**Given** `client/src/api/tasksApi.ts` exists
**When** reviewed
**Then** it exports `getTasks()`, `createTask(text)`, `updateTask(id, patch)`, and `deleteTask(id)` — no other file in `client/src/` calls `fetch`

**Given** any of the four functions receives a non-2xx HTTP response
**When** the response is parsed
**Then** a typed `ApiError` (from `@shared/types`) is thrown — the function never returns `undefined` on failure

**Given** `getTasks()` is called and the server returns 200
**When** the response is parsed
**Then** it returns a `Task[]` typed via `@shared/types` with all fields in `camelCase`

**Given** `createTask("Buy milk")` is called
**When** the server returns 201
**Then** it returns the created `Task` object typed via `@shared/types`

**Given** `VITE_API_URL` is set in the client environment
**When** any function builds the request URL
**Then** it uses `import.meta.env.VITE_API_URL` as the base — no hardcoded `localhost` URLs

---

### Story 3.2: `useTasks` Hook

As a developer,
I want a `useTasks` custom hook that owns all task state and exposes CRUD operations,
So that components are only responsible for rendering and never contain data-fetching or state logic.

**Acceptance Criteria:**

**Given** `client/src/hooks/useTasks.ts` exists
**When** called from a component
**Then** it returns `{ tasks: Task[], isLoading: boolean, error: string | null, createTask, toggleTask, deleteTask }`

**Given** the component mounts for the first time
**When** the initial fetch is in flight
**Then** `isLoading` is `true`; once the fetch resolves (success or error) `isLoading` becomes `false` and never returns to `true`

**Given** `createTask`, `toggleTask`, or `deleteTask` is called
**When** the mutation is in flight
**Then** `isLoading` remains `false` — mutations use the optimistic UI pattern and do NOT show a loading indicator

**Given** any mutation is called
**When** it follows the optimistic UI 3-step pattern
**Then**: (1) local state is updated immediately, (2) API call is fired, (3a) on success the local state is confirmed/updated with server response, (3b) on failure local state is rolled back to the pre-mutation snapshot and `error` is set to a user-facing string

**Given** `error` is non-null after a failed mutation
**When** the next operation of the same type succeeds
**Then** `error` is reset to `null`

**Given** a mutation has failed and `error` is non-null
**When** the user re-triggers the same action (e.g. attempts to create/toggle/delete again)
**Then** the retry is treated as a fresh operation — no dedicated retry button exists; re-triggering the action is the retry mechanism (FR13, NFR15)

**Given** `client/src/hooks/useTasks.test.ts` exists co-located
**When** run via Vitest
**Then** it passes ≥7 test cases: initial load success, initial load error, createTask success (optimistic + confirm), createTask rollback on API error, toggleTask success, toggleTask rollback, deleteTask success, deleteTask rollback

---

### Story 3.3: `TaskInput` Component

As a user,
I want a text input with a submit button to create new tasks,
So that I can add tasks quickly with keyboard or pointer without leaving the input area.

**Acceptance Criteria:**

**Given** `client/src/components/TaskInput.tsx` is rendered
**When** the user types text and presses Enter or clicks the submit button
**Then** `createTask` is called with the trimmed text and the input is cleared

**Given** the input is empty or contains only whitespace
**When** the user presses Enter or clicks submit
**Then** `createTask` is NOT called — the submission is a no-op

**Given** `createTask` resolves successfully
**When** the input is cleared
**Then** keyboard focus returns to the input field (FR22)

**Given** the input element is rendered
**When** inspected with a screen reader
**Then** it has an accessible label associated via `<label>` (or `aria-label`) — no unlabelled input (FR23)

**Given** `TaskInput.test.tsx` exists co-located
**When** run via Vitest + React Testing Library
**Then** it passes: renders input and button, submit calls hook with trimmed text, empty submit is no-op, input clears after submit, focus returns to input after create

---

### Story 3.4: `TaskItem` Component

As a user,
I want each task displayed with a checkbox to toggle completion and a delete button,
So that I can manage individual tasks without navigating away.

**Acceptance Criteria:**

**Given** `client/src/components/TaskItem.tsx` receives a `Task` prop with `completed: false`
**When** rendered
**Then** it shows the task text without strikethrough and the checkbox is unchecked

**Given** the task has `completed: true`
**When** rendered
**Then** the task text has a CSS strikethrough style applied (FR8)

**Given** the user checks or unchecks the checkbox
**When** the change event fires
**Then** `toggleTask(task.id)` is called

**Given** the user clicks the delete button
**When** the click event fires
**Then** `deleteTask(task.id)` is called

**Given** the delete button renders with only an icon
**When** inspected by a screen reader
**Then** it has `aria-label="Delete task"` (or equivalent accessible name) (FR23)

**Given** the checkbox `<input>` and its `<label>` are rendered
**When** inspected
**Then** the `<label>` `htmlFor` matches the `<input>` `id` — correctly associated for screen reader support (FR20)

**Given** the task's `createdAt` timestamp is present
**When** rendered
**Then** a human-readable relative time string is shown (e.g. "2 hours ago") using `Intl.RelativeTimeFormat` or equivalent (FR10)

**Given** `TaskItem.test.tsx` exists co-located
**When** run via Vitest + React Testing Library
**Then** it passes: renders text, renders relative timestamp, checkbox calls toggleTask, delete button calls deleteTask, completed task has strikethrough class, aria-label present on delete button

---

### Story 3.5: `TaskList` Component

As a user,
I want tasks displayed in two sections — Active and Completed — with correct ordering and all non-happy-path states handled,
So that I always understand the state of my task list regardless of data or network conditions.

**Acceptance Criteria:**

**Given** `TaskList` receives `isLoading: true`
**When** rendered
**Then** a loading indicator (spinner or skeleton) is visible; no task items are rendered (FR12)

**Given** `TaskList` receives `isLoading: false` and `tasks: []`
**When** rendered
**Then** an empty-state message is visible (e.g. "No tasks yet") (FR11)

**Given** `TaskList` receives a mix of active and completed tasks
**When** rendered
**Then** active tasks appear in a section above completed tasks; within each section tasks are ordered reverse-chronologically by `createdAt` (FR6, FR7, FR9)

**Given** `TaskList` receives a non-null `error` string
**When** rendered
**Then** an inline error banner is visible containing the error message alongside any existing tasks (not replacing them) (FR13, NFR16)

**Given** the error banner is visible after a failed mutation
**When** the user re-triggers the same action from the UI (e.g. re-submits the form or re-clicks the button)
**Then** the banner clears and the fresh attempt proceeds — no dedicated "Retry" button is rendered in the error banner; the existing input/controls serve as the retry affordance (FR13)

**Given** the error banner is rendered
**When** inspected
**Then** it is wrapped in or announces to an `aria-live="polite"` region so screen readers announce the error (FR24)

**Given** `TaskList.test.tsx` exists co-located
**When** run via Vitest + React Testing Library
**Then** it passes: loading state renders spinner, empty state renders message, active/completed grouping correct, error banner visible with aria-live attribute

---

### Story 3.6: `ErrorBoundary` Component

As a developer,
I want an `ErrorBoundary` class component at the application root,
So that uncaught rendering errors are caught and a fallback UI is displayed instead of a blank crash (FR28, NFR17).

**Acceptance Criteria:**

**Given** `client/src/components/ErrorBoundary.tsx` exists
**When** all children render without throwing
**Then** children are rendered normally — no fallback UI is shown

**Given** a child component throws an error during render
**When** React calls `componentDidCatch`
**Then** the fallback UI (a visible error message, not a blank screen) is displayed instead of the crashed subtree

**Given** the `ErrorBoundary` catches a render error
**When** the error is handled
**Then** no uncaught exception propagates up — the application remains operable outside the boundary

**Given** `ErrorBoundary.test.tsx` exists co-located
**When** run via Vitest + React Testing Library
**Then** it passes: renders children normally, renders fallback when a child throws

---

### Story 3.7: SPA Routing, `HomePage`, and Global Styles

As a user,
I want the application to load as a single-page app with a responsive layout and complete task management UI on a single route,
So that the app feels fast, works on any viewport, and is fully navigable by keyboard.

**Acceptance Criteria:**

**Given** `client/src/main.tsx` is reviewed
**When** the React tree is rendered
**Then** the app is wrapped in `<BrowserRouter>` from React Router 7 (FR25)

**Given** `client/src/App.tsx` is reviewed
**When** the router renders
**Then** a single route `/` renders `<HomePage>`

**Given** `client/src/pages/HomePage.tsx` is reviewed
**When** rendered
**Then** it calls `useTasks()` once and passes the returned state and handlers as props to `<TaskInput>` and `<TaskList>` — no child component calls `useTasks` independently

**Given** `client/src/styles/index.css` is applied
**When** the viewport is 320px wide
**Then** all content is visible and no horizontal overflow occurs (FR26)

**Given** any interactive element (input, button, checkbox) is focused via keyboard Tab
**When** inspected
**Then** a visible focus ring is rendered meeting ≥3:1 contrast ratio against the adjacent background (FR21, NFR12)

**Given** touch targets for checkbox and delete button are measured
**When** computed CSS size is checked
**Then** both meet ≥44×44 CSS px minimum (FR27)

---

## Epic 4: Quality Gates & Production Deployment

### Story 4.1: Playwright E2E Test Specs

As a developer,
I want four Playwright E2E test specs covering the core user journeys,
So that the full stack is verified end-to-end and regressions are caught before reaching `main`.

**Acceptance Criteria:**

**Given** `e2e/tests/createTask.spec.ts` is run against the full stack
**When** the user types a task and submits
**Then** the created task appears in the active section

**Given** `e2e/tests/completeTask.spec.ts` is run
**When** the user toggles the checkbox on an active task
**Then** the task moves to the completed section and displays strikethrough styling

**Given** `e2e/tests/deleteTask.spec.ts` is run
**When** the user clicks the delete button on a task
**Then** the task is removed from the list entirely

**Given** `e2e/tests/apiFailure.spec.ts` is run with the backend unavailable or mocked to return errors
**When** the frontend attempts to load or mutate tasks
**Then** the inline error state is visible in the UI

**Given** `playwright.config.ts` (at monorepo root or `e2e/`) is reviewed
**When** Playwright starts
**Then** it configures `webServer` entries to start both the Vite dev server and the Fastify server before any tests run

**Given** all 4 spec files are run via `npm run test:e2e` at the monorepo root
**When** both services are running
**Then** all specs pass with no hardcoded `localhost` port values — ports come from `playwright.config.ts` `baseURL`

---

### Story 4.2: README & Architecture Decision Summary

As a developer,
I want a comprehensive `README.md` at the monorepo root,
So that anyone can clone the repo and run the full application locally in under 5 minutes (FR29).

**Acceptance Criteria:**

**Given** `README.md` exists at the monorepo root
**When** read by a developer who meets the prerequisites
**Then** they can complete `git clone` → running app in ≤5 minutes following only the README

**Given** the README is reviewed
**When** checked for completeness
**Then** it contains: project overview, prerequisites (Node.js version, npm version), step-by-step local setup (`npm install`, `.env` file creation from `.env.example`, `npm run dev`), and all npm scripts documented (`dev`, `build`, `test`, `test:e2e`, `lint`) with a one-line description of each

**Given** the README includes an "Architecture" section
**When** read
**Then** it summarises: monorepo structure, Vite SPA + Fastify API + SQLite stack, `shared/types.ts` type contract, and the optimistic UI pattern — sufficient context for a new developer to understand the key design decisions without reading `architecture.md` in full

---

### Story 4.3: Vercel & Railway Deployment Configuration

As a developer,
I want Vercel and Railway deployment configurations in place,
So that the application can be deployed to production with HTTPS (NFR6) and SQLite data persists across Railway restarts.

**Acceptance Criteria:**

**Given** Vercel deployment is configured (via `vercel.json` or Vercel project settings)
**When** a push triggers a Vercel build
**Then** `rootDirectory` is `client/`, build command is `npm run build`, output directory is `dist/`, and `VITE_API_URL` is set to the Railway backend URL

**Given** Railway deployment is configured (via `railway.toml` or `Procfile`)
**When** Railway starts the service
**Then** the start command runs the compiled server entry point and `DATABASE_PATH` points to the persistent volume mount path

**Given** `CORS_ORIGIN` is set on Railway
**When** the Fastify server starts
**Then** it allows requests from the Vercel production URL only

**Given** `client/.env.example` and `server/.env.example` are reviewed
**When** checked
**Then** both files are complete and list every required environment variable with a placeholder or example value — no variable is undocumented

**Given** both Vercel and Railway are deployed
**When** the app is accessed via their URLs
**Then** all traffic is served over HTTPS — no additional TLS configuration required beyond platform defaults (NFR6)

---

### Story 4.4: Test Coverage Gate Verification

As a developer,
I want verified ≥80% test coverage for core business logic and a CI gate enforcing it,
So that the FR31 coverage requirement is formally met and protected from regressions.

**Acceptance Criteria:**

**Given** `npm run test:coverage` is run in `client/`
**When** the coverage report is generated
**Then** line and branch coverage across `src/hooks/` and `src/components/` is ≥80%

**Given** server tests are run with coverage (via `node --test` + `--experimental-test-coverage` or a wrapper)
**When** the coverage report is generated
**Then** line coverage across `src/routes/` and `src/repositories/` is ≥80%

**Given** the `ci.yml` GitHub Actions workflow is reviewed
**When** checked
**Then** it includes a coverage check step that fails the build if coverage drops below 80% (FR31)

**Given** coverage is verified at ≥80%
**When** the test suite is inspected
**Then** coverage is achieved through meaningful assertions on real behaviour — no trivial pass-through code inflating the numbers
