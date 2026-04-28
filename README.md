# Todo App

A full-stack task management application built with React, Fastify, and SQLite. Create, complete, and delete tasks with instant optimistic UI feedback.

## Prerequisites

- [Node.js](https://nodejs.org/) **v22** (includes npm)

## Quick Start

```bash
git clone <repo-url>
cd todo-app
npm install
```

Create environment files from the provided examples:

```bash
cp client/.env.example client/.env
cp server/.env.example server/.env
```

Start both servers (in separate terminals):

```bash
# Terminal 1 — backend (Fastify on http://localhost:3000)
npm run dev -w server

# Terminal 2 — frontend (Vite on http://localhost:5173)
npm run dev -w client
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Available Scripts

### Root

Run from the monorepo root:

| Script | Description |
|--------|-------------|
| `npm test` | Run all workspace unit tests |
| `npm run test:shared` | Test shared type definitions |
| `npm run lint` | Lint all workspaces |
| `npm run test:e2e` | Run Playwright E2E tests (starts both servers automatically) |
| `npm run test:e2e:ui` | Run E2E tests with Playwright UI |

### Client (`client/`)

Run with `npm run <script> -w client` from the root, or `npm run <script>` from `client/`:

| Script | Description |
|--------|-------------|
| `dev` | Start Vite dev server on port 5173 |
| `build` | Production build to `dist/` |
| `preview` | Preview production build locally |
| `test` | Run component and hook unit tests (Vitest) |
| `test:watch` | Run tests in watch mode |
| `test:coverage` | Run tests with coverage report |
| `lint` | Lint client source files |

### Server (`server/`)

Run with `npm run <script> -w server` from the root, or `npm run <script>` from `server/`:

| Script | Description |
|--------|-------------|
| `dev` | Start Fastify dev server on port 3000 |
| `build` | Build server for production |
| `start` | Start production server |
| `typecheck` | TypeScript type checking |
| `test` | Run server unit tests (Node.js `node:test`) |
| `test:watch` | Run tests in watch mode |
| `lint` | Lint server source files |

## Architecture

### Monorepo Structure

This project uses **npm workspaces** with two workspaces:

- **`client/`** — React SPA (Vite 8, TypeScript strict)
- **`server/`** — REST API (Fastify v5, TypeScript strict, SQLite via better-sqlite3)
- **`shared/`** — Plain directory (not a workspace) containing the shared type contract

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript (Vite 8) |
| Backend | Fastify v5 + TypeScript |
| Database | SQLite (better-sqlite3) |
| E2E Tests | Playwright |
| CI/CD | GitHub Actions |

### Shared Type Contract

[`shared/types.ts`](shared/types.ts) exports `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, and `ApiError`. Both workspaces import these via the `@shared/types` path alias — types are never redefined locally.

### Optimistic UI

All mutations (create, toggle, delete) follow a 3-step pattern:

1. **Snapshot** current state
2. **Apply** the change to the UI immediately
3. **Confirm** on API success, or **rollback** to the snapshot on failure

This keeps the UI responsive while maintaining data consistency.

### Data Flow

```
Browser → React components → useTasks hook → tasksApi.ts → Fastify routes → TaskRepository → SQLite
```

### Testing Strategy

- **Client unit tests** — Vitest + React Testing Library, co-located with source files
- **Server unit tests** — Node.js `node:test`, co-located with source files
- **E2E tests** — Playwright in `e2e/tests/`, testing the full running stack
- **CI** — GitHub Actions runs lint + unit tests on every push; E2E on `main` only

## Project Structure

```
todo-app/
├── package.json                  # npm workspaces root
├── tsconfig.base.json            # shared TypeScript strict config
├── .eslintrc.base.js             # shared ESLint rules
├── shared/
│   └── types.ts                  # Task, CreateTaskPayload, UpdateTaskPayload, ApiError
├── client/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx              # entry point + BrowserRouter
│       ├── App.tsx               # route definitions
│       ├── api/
│       │   └── tasksApi.ts       # fetch wrappers for /api/tasks
│       ├── hooks/
│       │   └── useTasks.ts       # single state source for tasks
│       ├── components/
│       │   ├── TaskInput.tsx     # task creation input
│       │   ├── TaskItem.tsx      # single task (toggle + delete)
│       │   ├── TaskList.tsx      # active/completed groups, loading/error states
│       │   └── ErrorBoundary.tsx # catches React render crashes
│       └── pages/
│           └── HomePage.tsx      # composes TaskInput + TaskList
├── server/
│   ├── package.json
│   ├── app.ts                    # Fastify app factory
│   ├── server.ts                 # entry point: listen on PORT
│   ├── migrations/
│   │   └── 001_create_tasks.sql
│   ├── plugins/
│   │   ├── db.ts                 # SQLite + WAL mode
│   │   ├── cors.ts               # CORS configuration
│   │   └── errorHandler.ts       # structured error responses
│   ├── repositories/
│   │   └── TaskRepository.ts     # all SQL; snake_case → camelCase mapping
│   └── routes/
│       ├── taskRoutes.ts         # GET/POST/PATCH/DELETE /api/tasks
│       └── schemas/
│           └── taskSchemas.ts    # JSON Schema validation
├── e2e/
│   ├── playwright.config.ts
│   └── tests/                    # E2E specs (create, complete, delete, apiFailure)
└── .github/
    └── workflows/
        ├── ci.yml                # lint + unit tests (all branches)
        └── e2e.yml               # Playwright (main only)
```

## Environment Variables

### Client (`client/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3000` |

### Server (`server/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server listening port | `3000` |
| `DATABASE_PATH` | SQLite database file path | `./data/todo.db` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |
