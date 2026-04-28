# Story 4.2: README & Architecture Decision Summary

Status: done

## Story

As a developer,
I want a comprehensive `README.md` at the monorepo root,
so that anyone can clone the repo and run the full application locally in under 5 minutes (FR29).

## Acceptance Criteria

1. **Given** `README.md` exists at the monorepo root **When** read by a developer who meets the prerequisites **Then** they can complete `git clone` → running app in ≤5 minutes following only the README

2. **Given** the README is reviewed **When** checked for completeness **Then** it contains: project overview, prerequisites (Node.js version, npm version), step-by-step local setup (`npm install`, `.env` file creation from `.env.example`, `npm run dev`), and all npm scripts documented (`dev`, `build`, `test`, `test:e2e`, `lint`) with a one-line description of each

3. **Given** the README includes an "Architecture" section **When** read **Then** it summarises: monorepo structure, Vite SPA + Fastify API + SQLite stack, `shared/types.ts` type contract, and the optimistic UI pattern — sufficient context for a new developer to understand the key design decisions without reading `architecture.md` in full

## Tasks / Subtasks

- [x] Create `README.md` at monorepo root (AC: 1, 2, 3)
  - [x] Project overview section (app description, what it does)
  - [x] Prerequisites section (Node.js 22, npm 10+)
  - [x] Quick Start / Local Setup section (clone → running in ≤5min)
    - [x] `npm install` (installs all workspaces)
    - [x] Create `.env` files from `.env.example` (`cp client/.env.example client/.env && cp server/.env.example server/.env`)
    - [x] `npm run dev` or workspace-specific dev commands
  - [x] Available Scripts section — document ALL scripts (AC: 2)
  - [x] Architecture section — summarise key decisions (AC: 3)
  - [x] Project Structure section — visual directory tree

- [x] Verify README correctness (AC: 1)
  - [x] Ensure all commands referenced in README actually work
  - [x] Ensure `.env.example` files are complete and match README instructions

### Review Findings

- [x] [Review][Patch] React version incorrect: README says "React 18" but `client/package.json` has `^19.2.5` — fix to "React 19" in Tech Stack table and Monorepo Structure bullet [README.md:L89,L96]
- [x] [Review][Patch] Vite version incorrect: README says "Vite 6" but `client/package.json` has `^8.0.10` — fix to "Vite 8" in Tech Stack table and Monorepo Structure bullet [README.md:L89,L96]
- [x] [Review][Defer] `styles/` directory omitted from project structure tree — `client/src/styles/index.css` exists but tree is intentionally abbreviated — deferred, cosmetic
- [x] [Review][Defer] `shared/types.test.ts` omitted from project structure under `shared/` — tree is intentionally abbreviated — deferred, cosmetic

## Dev Notes

### Critical: This is a NEW file — no file exists at the root today

There is **no** `README.md` at the monorepo root. This story creates it. Do NOT modify the existing `client/README.md` or `server/README.md` — those are boilerplate from Vite and Fastify generators and are not in scope.

### File to Create

```
README.md   ← NEW file at monorepo root (/Users/pmusce/workspace/aine/README.md)
```

### Required Content Sections (from AC analysis)

The README MUST contain these sections in this order:

1. **Project Title + Overview** — "Todo App" — a full-stack task management application built with React + Fastify + SQLite
2. **Prerequisites** — Node.js 22, npm (comes with Node.js)
3. **Quick Start** — exact commands to go from `git clone` to running app:
   ```bash
   git clone <repo-url>
   cd todo-app
   npm install
   cp client/.env.example client/.env
   cp server/.env.example server/.env
   npm run dev -w server   # starts Fastify on :3000
   npm run dev -w client   # starts Vite on :5173
   ```
4. **Available Scripts** — ALL scripts from all 3 `package.json` files, with one-line descriptions
5. **Architecture** — monorepo structure, tech stack summary, `shared/types.ts` type contract, optimistic UI pattern
6. **Project Structure** — visual directory tree (abbreviated, showing key files)

### All npm Scripts to Document

#### Root (`package.json`):
| Script | Command | Description |
|--------|---------|-------------|
| `test` | `npm run test --workspaces --if-present` | Run all workspace unit tests |
| `test:shared` | `node --test shared/types.test.ts` | Test shared type definitions |
| `lint` | `npm run lint --workspaces --if-present` | Lint all workspaces |
| `test:e2e` | `playwright test --config e2e/playwright.config.ts` | Run Playwright E2E tests (starts both servers automatically) |
| `test:e2e:ui` | `playwright test --ui --config e2e/playwright.config.ts` | Run E2E tests with Playwright UI |

#### Client (`client/package.json`):
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server on port 5173 |
| `build` | `vite build` | Production build to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `test` | `vitest run` | Run component/hook unit tests |
| `test:watch` | `vitest` | Run tests in watch mode |
| `test:coverage` | `vitest run --coverage` | Run tests with coverage report |
| `lint` | `eslint src --ext .ts,.tsx` | Lint client source files |

#### Server (`server/package.json`):
| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `fastify start -l info -P app.ts` | Start Fastify dev server on port 3000 |
| `build` | `node build.mjs` | Build server for production |
| `start` | `node build/server/server.js` | Start production server |
| `typecheck` | `tsc --noEmit` | TypeScript type checking |
| `test` | `node --experimental-test-module-mocks --test` | Run server unit tests |
| `test:watch` | `node --experimental-test-module-mocks --test --watch` | Run tests in watch mode |
| `lint` | `eslint . --ext .ts` | Lint server source files |

### Architecture Section Must Cover

1. **Monorepo structure**: npm workspaces with `client/` and `server/` workspaces; `shared/` is a plain directory (not a workspace) at root
2. **Tech stack**: React 18 + TypeScript (Vite 6) frontend, Fastify v5 + TypeScript backend, SQLite (better-sqlite3) database
3. **Shared type contract**: `shared/types.ts` exports `Task`, `CreateTaskPayload`, `UpdateTaskPayload`, `ApiError` — imported by both workspaces via `@shared/types` alias
4. **Optimistic UI pattern**: all mutations (create, toggle, delete) use a 3-step pattern: (1) snapshot current state, (2) apply change immediately, (3a) confirm on API success or (3b) rollback to snapshot on failure
5. **Data flow**: Browser → React components → `useTasks` hook → `tasksApi.ts` → Fastify routes → `TaskRepository` → SQLite
6. **Testing strategy**: Co-located unit tests (Vitest client-side, `node:test` server-side), E2E via Playwright at monorepo root
7. **CI/CD**: GitHub Actions — lint + unit tests on all pushes, E2E on `main` only

### Environment Variables Reference

#### Client (`client/.env` — from `client/.env.example`):
```
VITE_API_URL=http://localhost:3000
```

#### Server (`server/.env` — from `server/.env.example`):
```
PORT=3000
DATABASE_PATH=./data/todo.db
CORS_ORIGIN=http://localhost:5173
```

### Tone and Style

- **Concise but complete** — a developer should be able to follow the README without reading any other project document
- **No marketing language** — this is a technical README for developers
- **Use fenced code blocks** for all commands
- **Use relative links** for referencing project files (e.g., `[architecture details](docs/architecture.md)`)
- Standard Markdown formatting — headings, tables, code blocks

### What NOT to Include

- No deployment instructions (that's Story 4.3)
- No test coverage details (that's Story 4.4)
- No badges or shields (not in ACs)
- No contributing guidelines (single developer project)
- Do NOT modify `client/README.md` or `server/README.md`

### Project Structure Notes

- The root `README.md` will be at the same level as `package.json`, `tsconfig.base.json`, `client/`, `server/`, `shared/`, `e2e/`
- The architecture doc `_bmad-output/planning-artifacts/architecture.md` has the full directory tree — use it as reference for the project structure section but produce an abbreviated version

### Previous Story Intelligence (Story 4.1)

Key learnings from the previous story (4-1 Playwright E2E):
- `VITE_API_URL` must be set in `client/.env` — the README setup instructions MUST include copying `.env.example` files
- Server dev command uses `fastify start -l info -P app.ts` (not `node server.ts`)
- Server does NOT have a root route `/` — only `/api/tasks` and sub-routes exist
- `npm run dev` does NOT exist at root level — must run workspace-specific dev commands: `npm run dev -w server` and `npm run dev -w client` (in separate terminals)
- `e2e/playwright.config.ts` `webServer` starts both servers automatically when running `npm run test:e2e` — no manual server startup needed for E2E
- The `.github/workflows/ci.yml` uses Node.js 22

### Git Intelligence

Recent commits show Epic 3 (frontend) and Epic 4 (E2E) are complete. The codebase is stable and well-tested. Last commit: `5aaed2f` — all E2E specs passing.

### References

- [epics.md — Epic 4, Story 4.2](_bmad-output/planning-artifacts/epics.md) — acceptance criteria source
- [architecture.md — Project Structure section](_bmad-output/planning-artifacts/architecture.md) — directory tree and architectural boundaries
- [project-context.md](_bmad-output/project-context.md) — naming conventions, testing rules, framework rules
- [client/.env.example](client/.env.example) — `VITE_API_URL=http://localhost:3000`
- [server/.env.example](server/.env.example) — `PORT`, `DATABASE_PATH`, `CORS_ORIGIN`
- [root package.json](package.json) — root-level scripts
- [client/package.json](client/package.json) — client scripts
- [server/package.json](server/package.json) — server scripts
- [.github/workflows/ci.yml](.github/workflows/ci.yml) — CI config (Node.js 22, lint + test on all branches)
- [.github/workflows/e2e.yml](.github/workflows/e2e.yml) — E2E config (Playwright on `main` only)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)

### Debug Log References

None — clean implementation with no issues.

### Completion Notes List

- Created `README.md` at monorepo root with all required sections: overview, prerequisites, quick start, available scripts, architecture, project structure, environment variables
- All 17 npm scripts documented across root (5), client (7), and server (7) package.json files
- Architecture section covers: monorepo structure, tech stack, shared type contract, optimistic UI pattern, data flow, testing strategy
- Quick Start uses workspace-specific `npm run dev -w server` / `npm run dev -w client` (no root-level `dev` script exists)
- Verified all scripts exist in their respective package.json files
- Verified `.env.example` files are complete and match README instructions
- All existing unit tests pass (21/21), lint clean
- Did NOT modify `client/README.md` or `server/README.md` (out of scope per story notes)

### File List

- `README.md` — CREATED (monorepo root README)
