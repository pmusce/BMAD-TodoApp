# Story 1.6: GitHub Actions CI Configuration

Status: done

## Story

As a developer,
I want GitHub Actions workflows that run lint and unit tests on every push and E2E tests on `main`,
So that automated quality gates enforce code standards before any code is merged.

## Acceptance Criteria

1. **Given** `.github/workflows/ci.yml` exists **When** reviewed **Then** it triggers on `push` to all branches, runs `npm ci` at root, `npm run lint --workspaces --if-present`, `npm test --workspaces --if-present`, and `npm run test:shared`
2. **Given** `.github/workflows/e2e.yml` exists **When** reviewed **Then** it triggers on `push` to `main` only, installs Playwright browsers via `npx playwright install --with-deps`, and runs `npm run test:e2e`
3. **Given** both workflow YAML files are parsed **When** validated **Then** no YAML syntax errors are present (validated locally via `python3 -c "import yaml; yaml.safe_load(open(...))"`)
4. **Given** the CI workflow is triggered by a push to a feature branch **When** all lint and unit tests pass **Then** `ci.yml` reports success and `e2e.yml` does NOT trigger (enforced by `branches: [main]` trigger in e2e.yml)

## Tasks / Subtasks

- [x] Task 1 — Fix pre-existing gap: add `test:shared` script to root `package.json` (AC: 1)
  - [x] Add `"test:shared": "node --test shared/types.test.ts"` to `scripts` in root `package.json`
  - [x] Verify `npm run test:shared` exits 0 at the monorepo root
  - [x] Rationale: `shared/` is not an npm workspace, so `npm test --workspaces` silently skips `shared/types.test.ts`; deferred from story 1-4 review

- [x] Task 2 — Fix pre-existing gap: add `fastify-cli` to `server/package.json` devDependencies (AC: 2)
  - [x] Add `"fastify-cli": "^7.0.0"` to `devDependencies` in `server/package.json`
  - [x] Run `npm install` from monorepo root to update `package-lock.json` and hoist `fastify` binary to `node_modules/.bin/fastify`
  - [x] Verify `node_modules/.bin/fastify --version` exits 0 — installed 7.4.1
  - [x] Rationale: `server/package.json` `dev` script calls `fastify start -l info -P app.ts`; without `fastify-cli`, the E2E `webServer` entry for the server will fail in CI; deferred from story 1-3/1-4 review

- [x] Task 3 — Create `.github/workflows/ci.yml` (AC: 1, 3, 4)
  - [x] Create `.github/workflows/` directory at monorepo root
  - [x] `on.push.branches: ['**']` — triggers on every branch push
  - [x] Job `lint-and-test` runs on `ubuntu-latest`
  - [x] Steps: `actions/checkout@v4` → `actions/setup-node@v4` (node 22, cache npm) → `npm ci` → `npm run lint --workspaces --if-present` → `npm test --workspaces --if-present` → `npm run test:shared`
  - [x] No E2E step in this workflow

- [x] Task 4 — Create `.github/workflows/e2e.yml` (AC: 2, 3, 4)
  - [x] `on.push.branches: [main]` — triggers on push to `main` only (satisfies AC4)
  - [x] Job `e2e` runs on `ubuntu-latest`
  - [x] Steps: `actions/checkout@v4` → `actions/setup-node@v4` (node 22, cache npm) → `npm ci` → `npx playwright install --with-deps` → `npm run test:e2e`
  - [x] `npm run test:e2e` resolves to `playwright test --config e2e/playwright.config.ts`
  - [x] In CI, `process.env.CI` is set to `true` so `reuseExistingServer: false`; both webServer entries (client :5173, server :3000) start fresh

- [x] Task 5 — Validate YAML syntax (AC: 3)
  - [x] Run `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/ci.yml'))"` — exit 0 ✅
  - [x] Run `python3 -c "import yaml; yaml.safe_load(open('.github/workflows/e2e.yml'))"` — exit 0 ✅
  - [x] Run `npm run test:shared` — 5 tests pass, exit 0 ✅
  - [x] Run `npm test --workspaces --if-present` — 10 tests pass, exit 0 ✅ (no regressions)

## Dev Notes

### Node.js Version Choice: 22 (LTS)

Use `node-version: 22` in `actions/setup-node@v4`. The server uses `import.meta.dirname` which requires Node.js ≥21. Node 22 is the current LTS as of 2025 and covers this requirement.

### `test:shared` Script Is a Required Gap Fix

`shared/` contains `types.ts` and `types.test.ts` but is deliberately NOT listed in the root `"workspaces"` array — it's a plain folder accessed via path alias, not a workspace package. As a result, `npm test --workspaces --if-present` silently skips it. The root script `test:shared` runs the types test directly via `node --test shared/types.test.ts`.

In `ci.yml`, run it as a separate step after `npm test --workspaces --if-present`:

```yaml
- run: npm run test:shared
```

### `fastify-cli` Must Be Present for E2E webServer Startup

The E2E `playwright.config.ts` `webServer` array has an entry that runs `npm run dev -w server`, which executes `fastify start -l info -P app.ts`. The `fastify` binary comes from the `fastify-cli` npm package, which is currently **missing** from `server/package.json` devDependencies (gap from Story 1-3 scaffold).

After `npm ci` in the GitHub Actions runner, `fastify-cli` must be present or the E2E webServer will fail to start. Add it to `server/package.json` devDependencies; npm workspaces hoisting ensures `node_modules/.bin/fastify` is available from the monorepo root.

Current server `dev` script (unchanged):
```json
"dev": "fastify start -l info -P app.ts"
```

`fastify-cli` v7.x is compatible with Fastify v5.

### ESLint via Workspace Hoisting

Root `package.json` already has `"eslint": "^8.57.0"` in devDependencies. With npm workspaces, this is hoisted to `node_modules/.bin/eslint`. Both `client/` and `server/` can resolve the binary without listing `eslint` in their own devDependencies.

`--ext .ts` / `--ext .ts,.tsx` is a valid ESLint v8 flag (not available in ESLint v9, but v8 is what the root uses). No changes needed to lint scripts.

### All E2E Tests Are `test.fixme` Stubs

`npm run test:e2e` in CI will start both webServer entries real (`reuseExistingServer: false` when `CI` is truthy) and then load 4 specs. Each spec contains a single `test.fixme(...)` which Playwright marks as "expected failure / skipped". `playwright test` exits **0** even with all tests skipped.

This means the E2E workflow will pass in CI as soon as:
1. Chromium is installed (`npx playwright install --with-deps`)
2. Both webServers start cleanly (client via `vite`, server via `fastify start`)

### GitHub Actions Trigger Syntax

```yaml
# ci.yml  — every branch
on:
  push:
    branches: ['**']

# e2e.yml — main only
on:
  push:
    branches: [main]
```

`branches: ['**']` matches all refs (feature/*, main, etc.). `branches: [main]` restricts to the exact branch name `main`. This satisfies AC4.

### Workflow Structure Overview

**ci.yml:**
| Step | Command |
|------|---------|
| Checkout | `actions/checkout@v4` |
| Node setup | `actions/setup-node@v4` (node 22, cache npm) |
| Install | `npm ci` |
| Lint | `npm run lint --workspaces --if-present` |
| Unit tests | `npm test --workspaces --if-present` |
| Shared types test | `npm run test:shared` |

**e2e.yml:**
| Step | Command |
|------|---------|
| Checkout | `actions/checkout@v4` |
| Node setup | `actions/setup-node@v4` (node 22, cache npm) |
| Install | `npm ci` |
| Playwright browsers | `npx playwright install --with-deps` |
| E2E tests | `npm run test:e2e` |

### File Checklist

| File | Status |
|------|--------|
| `.github/workflows/ci.yml` | NEW |
| `.github/workflows/e2e.yml` | NEW |
| `package.json` | MODIFIED — add `test:shared` script |
| `server/package.json` | MODIFIED — add `fastify-cli` devDependency |
| `package-lock.json` | MODIFIED — updated by `npm install` |

## File List

- `.github/workflows/ci.yml` (new)
- `.github/workflows/e2e.yml` (new)
- `package.json` (modified)
- `server/package.json` (modified)
- `package-lock.json` (modified)

## Dev Agent Record

### Completion Notes

- Task 1: Added `"test:shared": "node --test shared/types.test.ts"` to root `package.json` scripts. `npm run test:shared` executes all 5 shared type tests — exit 0. Closes deferred gap from story 1-4 review.
- Task 2: Added `"fastify-cli": "^7.0.0"` to `server/package.json` devDependencies. `npm install` installed version 7.4.1, hoisted to `node_modules/.bin/fastify`. Required for the E2E webServer `npm run dev -w server` to work in CI.
- Task 3: Created `.github/workflows/ci.yml` — triggers `on: push: branches: ['**']`; job `lint-and-test` on `ubuntu-latest`; steps: checkout → setup-node (22, npm cache) → `npm ci` → lint (workspaces) → unit tests (workspaces) → shared types test.
- Task 4: Created `.github/workflows/e2e.yml` — triggers `on: push: branches: [main]` only; job `e2e` on `ubuntu-latest`; steps: checkout → setup-node (22, npm cache) → `npm ci` → `npx playwright install --with-deps` → `npm run test:e2e`. AC4 satisfied: feature branch pushes cannot trigger this workflow.
- Task 5: Both YAML files validated via `python3 -c "import yaml; yaml.safe_load(...)"` — both exit 0. Full regression: 10 unit tests + 5 shared tests — all pass, exit 0.

## Change Log

- 2026-04-27: Story implemented — created `.github/workflows/ci.yml` (all-branch lint+unit CI), `.github/workflows/e2e.yml` (main-only Playwright E2E), added `test:shared` root script, added `fastify-cli` devDependency to server. All ACs verified.

## Tasks / Subtasks — Review Findings

- [x] [Review][Patch] No `timeout-minutes` on e2e job [.github/workflows/e2e.yml] — added `timeout-minutes: 10` to the `e2e` job
- [x] [Review][Defer] No `pull_request` trigger in ci.yml [.github/workflows/ci.yml] — deferred, pre-existing: spec explicitly scopes to `push` only; PR trigger is a beyond-spec enhancement
- [x] [Review][Defer] No Playwright report artifact upload [.github/workflows/e2e.yml] — deferred, pre-existing: all E2E tests are `test.fixme` stubs; report content is meaningless until Epic 4 adds real tests
- [x] [Review][Defer] `node --test *.ts` relies on Node 22 implicit TS stripping [package.json] — deferred, pre-existing: works on Node 22.6+ (confirmed locally and CI uses Node 22 LTS ≥ 22.12); revisit if Node version pin changes
- [x] [Review][Defer] No `concurrency` group to cancel superseded runs — deferred, pre-existing: optimization not correctness; add when CI minutes become a concern
- [x] [Review][Defer] No `permissions` block for GITHUB_TOKEN — deferred, pre-existing: no elevated permissions required; hardening appropriate in a future security pass
