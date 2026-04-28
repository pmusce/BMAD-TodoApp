# Story 4.3: Dockerfiles & Docker Compose

Status: review

## Story

As a developer,
I want multi-stage Dockerfiles for frontend and backend plus a `docker-compose.yml` orchestrating all containers,
so that the entire application can be built and run in containers with a single command.

## Acceptance Criteria

1. **Given** `server/Dockerfile` exists **When** reviewed **Then** it uses a multi-stage build (build stage + production stage), runs as a non-root user, includes a `HEALTHCHECK` instruction pointing to `/api/healthz`, and copies only production artifacts to the final image

2. **Given** `client/Dockerfile` exists **When** reviewed **Then** it uses a multi-stage build (build stage + nginx stage), runs as a non-root user, and serves the built SPA via nginx with a health check

3. **Given** `GET /api/healthz` is called on the backend **When** the server is running and the database is accessible **Then** the response is `200` with `{ "status": "ok" }` — when the database is not accessible the response is `503` with `{ "status": "error" }`

4. **Given** `docker-compose.yml` exists at the monorepo root **When** reviewed **Then** it defines services for `client` and `server`, configures a shared network, mounts a named volume for SQLite persistence at `server/data/`, and exposes ports 5173 (client) and 3000 (server)

5. **Given** `docker compose up --build` is run from the monorepo root **When** both containers start **Then** the frontend is accessible at `http://localhost:5173`, the backend at `http://localhost:3000`, and tasks can be created/read/updated/deleted through the UI

6. **Given** `docker compose logs` is run **When** containers are running **Then** both container logs are accessible and health status is visible

7. **Given** `.env.example` files are reviewed **When** checked **Then** all environment variables needed for Docker operation are documented

8. **Given** Docker Compose profiles are configured **When** `docker compose --profile dev up` is run **Then** dev-specific settings apply (e.g., source volume mounts for hot-reload); `docker compose --profile test up` runs the test suite in containers

## Tasks / Subtasks

- [x] Task 1: Create backend health check route (AC: 3)
  - [x] Create `server/routes/healthzRoutes.ts` with `GET /api/healthz` route (use `autoPrefix = '/api/healthz'` + `GET '/'` pattern)
  - [x] Route must check `fastify.db` accessibility (run a trivial query like `SELECT 1`)
  - [x] Return `200 { "status": "ok" }` on success, `503 { "status": "error" }` on DB failure
  - [x] Add JSON Schema for the response inline (simple enough)
  - [x] Create co-located test `server/routes/healthzRoutes.test.ts`

- [x] Task 2: Create server Dockerfile (AC: 1)
  - [x] Create `server/Dockerfile` — multi-stage build
  - [x] Stage 1 (`build`): Use `node:22-alpine`, install build tools for `better-sqlite3` native compilation (`python3 make g++`), copy monorepo root files + `server/` + `shared/`, run `npm ci --workspace=server`, run `npm run build -w server`
  - [x] Stage 2 (`production`): Use `node:22-alpine`, install only runtime native deps for `better-sqlite3`, copy `build/server/` artifacts + `node_modules/` (production only) from build stage, run as non-root user
  - [x] Add `HEALTHCHECK` instruction: `wget` to `http://localhost:3000/api/healthz`
  - [x] Expose port 3000

- [x] Task 3: Create client Dockerfile (AC: 2)
  - [x] Create `client/Dockerfile` — multi-stage build
  - [x] Stage 1 (`build`): Use `node:22-alpine`, copy monorepo root files + `client/` + `shared/`, run `npm ci --workspace=client`, run `npm run build -w client` (with `VITE_API_URL` build arg)
  - [x] Stage 2 (`production`): Use `nginx:stable-alpine`, copy built SPA from `client/dist/` to `/usr/share/nginx/html`
  - [x] Add custom nginx config for SPA routing (`try_files $uri $uri/ /index.html`)
  - [x] Run nginx as non-root user
  - [x] Add `HEALTHCHECK` instruction

- [x] Task 4: Create `.dockerignore` files (AC: 1, 2)
  - [x] Create root `.dockerignore` to exclude `node_modules/`, `.git/`, `*.db`, `test-results/`, `playwright-report/`, `_bmad*/`, `coverage/`, `.env*`

- [x] Task 5: Create `docker-compose.yml` (AC: 4, 5, 6)
  - [x] Define `server` service: build from `server/Dockerfile` (context: `.`), port 3000, env vars, named volume for `./server/data/`, health check
  - [x] Define `client` service: build from `client/Dockerfile` (context: `.`), port 5173, depends_on server (healthy)
  - [x] Define shared network (`app-network`)
  - [x] Define named volume (`sqlite-data`) mounted at `/app/server/data`

- [x] Task 6: Configure Compose profiles (AC: 8)
  - [x] `dev` profile: mount source volumes for hot-reload, use dev commands instead of production
  - [x] `test` profile: run the test suite in containers

- [x] Task 7: Update `.env.example` files for Docker (AC: 7)
  - [x] Add Docker-specific comments/examples to `server/.env.example`
  - [x] Add Docker-specific comments/examples to `client/.env.example`

- [x] Task 8: Verify end-to-end Docker operation (AC: 5, 6)
  - [x] Docker daemon not running in environment — verified file structure and configuration correctness
  - [x] All unit tests (80/80) pass — no regressions
  - [x] All E2E tests (4/4) pass — full stack verified
  - [x] Lint clean across all workspaces

## Dev Notes

### CRITICAL: `better-sqlite3` Native Compilation on Alpine

`better-sqlite3` (v12.9.0) is a native Node.js addon that compiles C++ code via `node-gyp`. On Alpine Linux:
- **Build stage** requires: `python3`, `make`, `g++` (install via `apk add --no-cache python3 make g++`)
- **Production stage** requires: the compiled `.node` binary only — no build tools needed at runtime, but `libstdc++` must be present (it is in `node:22-alpine` by default)

### CRITICAL: Monorepo Build Context

Both Dockerfiles live in their workspace (`server/Dockerfile`, `client/Dockerfile`) but MUST be built with the **monorepo root as the Docker context** because:
- `server/` build needs `shared/types.ts` (resolved via esbuild alias in `build.mjs`)
- `client/` build needs `shared/types.ts` (resolved via Vite `resolve.alias`)
- Both need root `package.json` + `package-lock.json` + `tsconfig.base.json`

Build commands in `docker-compose.yml`:
```yaml
server:
  build:
    context: .
    dockerfile: server/Dockerfile
client:
  build:
    context: .
    dockerfile: client/Dockerfile
```

### CRITICAL: `VITE_API_URL` is a Build-Time Variable

`VITE_API_URL` is baked into the client bundle at Vite build time — it is NOT read at runtime. In Docker:
- Use a `ARG VITE_API_URL` in the client Dockerfile build stage
- Pass it via `docker-compose.yml` build args: `args: { VITE_API_URL: http://localhost:3000 }`
- For the Docker Compose setup where both services are on localhost, the default `http://localhost:3000` works

### Server Build Process (Existing — DO NOT CHANGE)

The server build is handled by `server/build.mjs` which uses esbuild:
1. `node build.mjs` compiles all `.ts` files → `build/server/` (ESM format)
2. `packages: 'external'` keeps all npm packages external (they come from `node_modules/` at runtime)
3. `@shared/types` alias resolves and bundles the shared types inline — no need to copy `shared/` to production
4. Migrations are copied: `build/server/migrations/`
5. Entry point: `node build/server/server.js`

### Server Production Dependencies

At runtime, the production server needs `node_modules/` with these packages (and their deps):
- `fastify`, `fastify-plugin`, `@fastify/autoload`, `@fastify/sensible`, `@fastify/cors`
- `better-sqlite3` (native addon — must be compiled for the target platform)
- `close-with-grace`
- `pino-pretty` (only for dev — can be excluded in production via `NODE_ENV=production` transport check in `server.ts`)

Use `npm ci --workspace=server --omit=dev` in the production stage to install only production deps. But note: esbuild is a devDependency used during build only — it's not needed in production.

### Server Startup in Production

`server.ts` already binds to `0.0.0.0` (line: `host: '0.0.0.0'`), which is correct for Docker. The start command is: `node build/server/server.js`. The `server/package.json` already has `"start": "node build/server/server.js"`.

### `pino-pretty` in Production

`server.ts` conditionally loads `pino-pretty` transport only when `NODE_ENV !== 'production'`. In the Docker production stage, set `ENV NODE_ENV=production` to disable pretty-printing and use JSON logs (better for `docker compose logs` parsing). However, `pino-pretty` is a production dependency in `package.json` — it won't break if present, it just won't be used when `NODE_ENV=production`.

### nginx SPA Configuration

The client SPA uses React Router with `BrowserRouter` (client-side routing). nginx must:
1. Serve static files from `/usr/share/nginx/html`
2. Fall back to `index.html` for all non-file routes (`try_files $uri $uri/ /index.html`)
3. Listen on port 80 internally (map to 5173 externally via Docker Compose)

Create `client/nginx.conf`:
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Running nginx as Non-Root

Use the official `nginxinc/nginx-unprivileged` image OR configure the standard `nginx:stable-alpine` to run as non-root:
- Set `pid /tmp/nginx.pid;` in nginx config
- Set temp paths to `/tmp/`
- Use `USER nginx` (uid 101) in Dockerfile
- Ensure the nginx config directory and html directory are readable by the nginx user

**Recommended approach**: Use `nginx:stable-alpine` and configure non-root manually (more control, simpler, well-documented).

### Health Check Commands

- **Server**: `HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/healthz || exit 1` (use `wget` — available in Alpine by default, unlike `curl`)
- **Client nginx**: `HEALTHCHECK --interval=30s --timeout=3s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:80/ || exit 1`

### Health Check Route Design

The `/api/healthz` route goes in `server/routes/healthzRoutes.ts` (matching the `taskRoutes.ts` naming convention). Fastify AutoLoad picks it up automatically via the `autoPrefix` export.

### Docker Compose Volume for SQLite

The SQLite database lives at `DATABASE_PATH=./data/todo.db` relative to the server working directory. In Docker:
- Mount a named volume to `/app/server/data` (assuming `/app` is the WORKDIR)
- Set `DATABASE_PATH=./data/todo.db` in the server container env
- The volume ensures data persists across container restarts

### Compose Profiles

**`dev` profile**: Override services with dev-oriented config:
- Mount source code as volumes for hot-reload
- Use `npm run dev` commands instead of production builds
- Skip build stages, run directly from source

**`test` profile**: Run test suites in containers:
- Could be a separate service that runs `npm test` and exits
- Or override the command to run tests

### Files to Create (NEW)

| File | Purpose |
|------|---------|
| `server/routes/healthzRoutes.ts` | `GET /api/healthz` health check endpoint |
| `server/routes/healthzRoutes.test.ts` | Co-located test for health check route |
| `server/Dockerfile` | Multi-stage Docker build for backend |
| `client/Dockerfile` | Multi-stage Docker build for frontend |
| `client/nginx.conf` | nginx config for SPA routing |
| `docker-compose.yml` | Multi-container orchestration |
| `.dockerignore` | Exclude files from Docker build context |

### Files to Update (EXISTING)

| File | Change |
|------|--------|
| `server/.env.example` | Add Docker-related comments |
| `client/.env.example` | Add Docker-related comments |
| `README.md` | Add Docker section (or defer to a later story — check AC 7) |

### Existing Route Pattern Reference (from `server/routes/taskRoutes.ts`)

Routes use Fastify AutoLoad with `autoPrefix` named export:
```ts
const taskRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => { /* ... */ })
}
export default taskRoutes
export const autoPrefix = '/api/tasks'
```

The health route MUST follow this exact pattern:
```ts
const healthzRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_request, reply) => { /* check db, return status */ })
}
export default healthzRoutes
export const autoPrefix = '/api/healthz'
```

Key conventions:
- Default export of a `FastifyPluginAsync` function
- `autoPrefix` named export sets the route prefix (AutoLoad reads this)
- Routes inside the plugin use relative paths (`'/'`, `'/:id'`)
- Access `fastify.db` (decorated by `plugins/db.ts`) for DB operations

### Testing the Health Route

**Co-located test** at `server/routes/healthzRoutes.test.ts`:
- Test happy path: mock `fastify.db` to succeed → expect `200 { "status": "ok" }`
- Test DB failure: mock `fastify.db` to throw → expect `503 { "status": "error" }`
- Follow the same mock pattern as `taskRoutes.test.ts` (mock at repository/db boundary)

### Project Structure Notes

All files align with the existing project structure:
- Route files go in `server/routes/` with test co-located
- Dockerfiles go in respective workspace roots (`server/Dockerfile`, `client/Dockerfile`)
- `docker-compose.yml` goes at monorepo root
- `.dockerignore` goes at monorepo root (Docker build context root)

### Review Findings

<!-- Code review performed 2026-04-28 — sources: blind, edge, auditor -->

**Decision needed:**
- [x] [Review][Decision→Defer] Dev/prod port conflict: `server` (no profile) and `server-dev` both bind port 3000 — resolved: document mutual exclusivity in README; `--profile dev` is not intended to run alongside the default stack

**Patches:**
- [x] [Review][Patch] SQLite data dir root-owned at runtime — fixed: CMD chowns volume mount then drops to appuser via su-exec [server/Dockerfile]
- [x] [Review][Patch] Production stage recompiles better-sqlite3 from scratch — fixed: added `npm prune --omit=dev` to build stage; production stage copies `/app/node_modules/` [server/Dockerfile]
- [x] [Review][Patch] `client/package.json` copied into production stage — fixed: removed unnecessary COPY [server/Dockerfile]
- [x] [Review][Patch] `test-runner` has no `networks` entry — fixed: added `networks: app-network` and `depends_on: server` [docker-compose.yml]
- [x] [Review][Patch] `test-runner` uses `node:22-alpine` — `npm test` runs unit tests only (not E2E); `node:22-alpine` is correct; added clarifying comment [docker-compose.yml]
- [x] [Review][Patch] `index.html` served without `Cache-Control: no-cache` — fixed: added `no-cache, no-store, must-revalidate` header to `location /` [client/nginx.conf]
- [x] [Review][Patch] Missing test case for healthz `get()` throwing — fixed: added `GET /api/healthz — get() throws after prepare()` test suite [server/routes/healthzRoutes.test.ts]
- [x] [Review][Patch] `sed` pid-path patch unverified — fixed: added `grep -q` assertion after sed; build fails if pattern unmatched [client/Dockerfile]

**Deferred:**
- [x] [Review][Defer] Unpinned image tags (`node:22-alpine`, `nginx:stable-alpine`) — deferred, pre-existing; acceptable for development context
- [x] [Review][Defer] nginx missing security headers (X-Frame-Options, CSP, Referrer-Policy) — deferred, out of story scope
- [x] [Review][Defer] `CORS_ORIGIN` / `VITE_API_URL` hardcoded as localhost — deferred, spec explicitly notes intentional for local-only Docker Compose setup
- [x] [Review][Defer] `SELECT 1` doesn't verify migrations ran — deferred, spec requires DB accessibility check only
- [x] [Review][Defer] `server-dev` runs `npm ci` on every start — deferred, dev DX concern not a correctness issue
- [x] [Review][Defer] `client/Dockerfile` npm ci layer cache order — deferred, minor optimization
- [x] [Review][Defer] gzip compression missing from nginx — deferred, optimization out of spec scope
- [x] [Review][Defer] healthz catch block swallows TypeErrors — deferred, 503 on any error is acceptable for a health endpoint

### Previous Story Intelligence (Story 4.2)

Key learnings from the previous story:
- Server does NOT have a root route `/` — only `/api/tasks` and sub-routes exist
- Server dev command: `fastify start -l info -P app.ts` (not `node server.ts`)
- Server production start: `node build/server/server.js`
- `npm run build -w server` runs `node build.mjs` (esbuild, not tsc)
- `.github/workflows/ci.yml` uses Node.js 22
- `.env.example` files are already complete for local dev
- README was created with all scripts documented — Docker section should be added

### Git Intelligence

Recent commits (most recent first):
- `5aaed2f` feat: Implement Task Management Features and Error Handling (Epic 3 + E2E)
- `62d6cb3` feat: implement `useTasks` hook
- `394333a` feat: implement unit tests for task route handlers
- `6920e36` feat: implement Fastify plugins
- `a846d0c` feat: implement TaskRepository
- `70dd4c3` feat: add GitHub Actions CI workflows
- `5b83ff1` feat: implement Playwright E2E scaffold
- `19590e3` feat: initialize server
- `3e14df7` Initial commit

Codebase is stable with all E2E tests passing. No in-flight changes to worry about.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 4, Story 4.3](../planning-artifacts/epics.md)
- [Source: _bmad-output/planning-artifacts/architecture.md — Infrastructure & Deployment section](../planning-artifacts/architecture.md)
- [Source: _bmad-output/project-context.md](../project-context.md)
- [Source: server/app.ts — AutoLoad configuration](../../server/app.ts)
- [Source: server/server.ts — server startup, host binding](../../server/server.ts)
- [Source: server/build.mjs — esbuild production build](../../server/build.mjs)
- [Source: server/package.json — scripts and dependencies](../../server/package.json)
- [Source: client/vite.config.ts — Vite config with @shared alias](../../client/vite.config.ts)
- [Source: client/index.html — SPA entry point](../../client/index.html)
- [Source: server/plugins/db.ts — SQLite connection + WAL mode](../../server/plugins/db.ts)
- [Source: server/migrations/001_create_tasks.sql — DB schema](../../server/migrations/001_create_tasks.sql)
- [Source: 4-2-readme-and-architecture-decision-summary.md — Previous story](./4-2-readme-and-architecture-decision-summary.md)

## Change Log

- 2026-04-28: Implemented all Docker containerization — health check route, multi-stage Dockerfiles, docker-compose.yml with profiles, .dockerignore, updated .env.example files

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (GitHub Copilot)

### Debug Log References

None — clean implementation with no issues.

### Completion Notes List

- Created `GET /api/healthz` health check route following existing `taskRoutes.ts` autoPrefix pattern — checks DB with `SELECT 1`, returns 200 ok / 503 error
- Created co-located test `healthzRoutes.test.ts` with 2 tests (DB accessible → 200, DB inaccessible → 503)
- Server Dockerfile: 2-stage build, `node:22-alpine`, installs native build tools for `better-sqlite3` in build stage, removes them in prod stage after `npm ci`, runs as non-root `appuser`, HEALTHCHECK via wget
- Client Dockerfile: 2-stage build, `node:22-alpine` for build + `nginx:stable-alpine` for serve, `VITE_API_URL` as build arg, custom nginx.conf with SPA `try_files` fallback, runs as nginx user (non-root)
- `.dockerignore` at monorepo root excludes node_modules, .git, *.db, test artifacts, _bmad, .env files
- `docker-compose.yml` with production services (server + client), dev profile (server-dev + client-dev with volume mounts), test profile (test-runner), shared network, named volume for SQLite persistence
- Updated both `.env.example` files with Docker-specific documentation
- All 80 unit tests pass (57 client + 23 server), all 4 E2E tests pass, lint clean
- Docker build could not be verified at runtime (Docker daemon not running) — requires manual verification with `docker compose up --build`

### File List

- server/routes/healthzRoutes.ts (NEW)
- server/routes/healthzRoutes.test.ts (NEW)
- server/Dockerfile (NEW)
- client/Dockerfile (NEW)
- client/nginx.conf (NEW)
- docker-compose.yml (NEW)
- .dockerignore (NEW)
- server/.env.example (MODIFIED)
- client/.env.example (MODIFIED)
