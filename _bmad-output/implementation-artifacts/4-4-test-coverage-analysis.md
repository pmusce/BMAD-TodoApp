# Story 4.4: Test Coverage Analysis

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want verified ≥70% test coverage for core business logic and identified gaps documented,
so that the coverage requirement is formally met and gaps are visible for future work.

## Acceptance Criteria

1. **Given** `npm run test:coverage` is run in `client/` **When** the coverage report is generated **Then** line and branch coverage across `src/hooks/` and `src/components/` is ≥70%

2. **Given** server tests are run with coverage **When** the coverage report is generated **Then** line coverage across `routes/` and `repositories/` is ≥70%

3. **Given** the `ci.yml` GitHub Actions workflow is reviewed **When** checked **Then** it includes a coverage check step that fails the build if coverage drops below 70%

4. **Given** coverage gaps are identified **When** analyzed **Then** a brief gap analysis is documented listing untested paths and rationale for deferral

## Tasks / Subtasks

- [x] Task 1: Configure and verify client-side coverage (AC: 1)
  - [x] Add coverage threshold configuration to `client/vite.config.ts` — set `coverage.thresholds` for lines and branches at 70% scoped to `src/hooks/` and `src/components/`
  - [x] Run `npm run test:coverage -w client` and capture current coverage levels
  - [x] If coverage is below 70%, identify the specific uncovered lines/branches and add targeted tests to close gaps
  - [x] Verify `npm run test:coverage -w client` now passes threshold check

- [x] Task 2: Configure and verify server-side coverage (AC: 2)
  - [x] Add `"test:coverage"` script to `server/package.json` using Node.js built-in coverage via `run()` API with `lineCoverage: 70` threshold enforcement
  - [x] Created `server/run-coverage.mjs` using `node:test` `run()` API — `--test-coverage-include` CLI flags caused incorrect coverage with `--experimental-test-module-mocks`, so used programmatic API instead
  - [x] Node.js test runner auto-excludes test files from coverage by default — no explicit exclude needed
  - [x] Run `npm run test:coverage -w server` and capture current coverage levels
  - [x] Coverage at 100% lines for routes/ and repositories/ — no gaps to close
  - [x] Verify the command exits cleanly with coverage summary visible in terminal output

- [x] Task 3: Add monorepo-level coverage script (AC: 1, 2)
  - [x] Add `"test:coverage"` script to root `package.json` that runs coverage in both workspaces sequentially: `npm run test:coverage -w client && npm run test:coverage -w server`
  - [x] Verify `npm run test:coverage` at monorepo root runs both workspace coverage checks

- [x] Task 4: Add coverage step to CI workflow (AC: 3)
  - [x] Edit `.github/workflows/ci.yml` to add a coverage step after the existing "Unit tests" step
  - [x] Client coverage step: `npm run test:coverage -w client` — Vitest exits with non-zero if thresholds not met
  - [x] Server coverage step: `npm run test:coverage -w server` — `run()` API with `lineCoverage: 70` exits non-zero if threshold not met
  - [x] Ensure coverage step failure blocks the CI pipeline

- [x] Task 5: Document coverage gap analysis (AC: 4)
  - [x] Review client coverage report output — identify any paths below 70% and list specific uncovered lines/branches
  - [x] Review server coverage report output — identify any paths below 70% and list specific uncovered lines/branches
  - [x] Add a `## Coverage Gap Analysis` section to this story's Dev Notes summarizing: current coverage percentages per directory, untested paths with rationale for deferral, and recommended next steps
  - [x] Cross-reference deferred-work.md for any testing-related deferred items that affect coverage

- [x] Task 6: Run full test suite to verify no regressions (AC: 1, 2, 3, 4)
  - [x] Run `npm test --workspaces` — all 81 tests pass (57 client + 24 server)
  - [x] Run `npm run test:coverage` at monorepo root — both workspaces pass thresholds
  - [x] Run `npm run lint --workspaces` — zero lint errors

## Dev Notes

### CRITICAL: Client Coverage Tooling — Already Installed

The client workspace already has `@vitest/coverage-v8@^3.2.4` as a devDependency and a `"test:coverage": "vitest run --coverage"` script in `client/package.json`. **DO NOT install additional coverage packages.** The `coverage` provider defaults to `v8` when `@vitest/coverage-v8` is present.

To configure **thresholds** in `client/vite.config.ts`, add to the existing `test` block:
```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./src/test/setup.ts'],
  passWithNoTests: true,
  coverage: {
    include: ['src/hooks/**', 'src/components/**'],
    thresholds: {
      lines: 70,
      branches: 70,
    },
  },
},
```

Vitest exits with non-zero code when thresholds are not met — CI naturally fails.

### CRITICAL: Server Coverage Tooling — Node.js Built-In

The server uses `node:test` (Node.js native test runner). Coverage is provided by the **`--experimental-test-coverage`** flag — NO external packages needed.

The `test:coverage` script for `server/package.json`:
```json
"test:coverage": "node --experimental-test-coverage --experimental-test-module-mocks --test --test-coverage-include=routes/ --test-coverage-include=repositories/"
```

Key flags:
- `--experimental-test-coverage` — enables V8 coverage collection (Stability: 1 - Experimental, but functional in Node.js 22)
- `--test-coverage-include=routes/` — scope coverage to only files under `routes/`
- `--test-coverage-include=repositories/` — also include `repositories/`
- Test files (`*.test.ts`) are automatically excluded from coverage by default in `node:test`

**Threshold enforcement in Node.js 22+**: The `node:test` runner does NOT have a built-in `--test-coverage-lines=70` CLI flag in Node.js 22 (that feature requires Node.js 23+). Since this project targets Node.js 22 (per CI config `node-version: 22`), threshold enforcement must be done by parsing output or using a wrapper script. **Two approaches**:

1. **Recommended — Parse coverage summary**: After running `node --experimental-test-coverage ...`, the spec reporter prints a coverage summary table. Create a tiny post-check script that parses the lcov output or the summary line.
2. **Alternative — Use `run()` API**: Write a `server/run-coverage.mjs` script that uses the `run()` API with `coverage: true` and `lineCoverage: 70` options — this exits non-zero if thresholds are not met. Example:
```js
import { run } from 'node:test';
import { spec } from 'node:test/reporters';

const stream = run({
  coverage: true,
  lineCoverage: 70,
  coverageIncludeGlobs: ['routes/**', 'repositories/**'],
});
stream.compose(spec).pipe(process.stdout);
stream.on('test:fail', () => { process.exitCode = 1; });
```

### CRITICAL: CI Workflow — Current State

The current `.github/workflows/ci.yml` runs:
1. `npm ci` (install)
2. `npm run lint --workspaces --if-present` (lint)
3. `npm test --workspaces --if-present` (unit tests)
4. `npm run test:shared` (shared types test)

Coverage is NOT currently included. Add coverage step(s) after unit tests. Since coverage runs the same tests again with instrumentation, it adds ~30s to CI time but catches threshold regressions.

### CRITICAL: Monorepo Build Idiosyncrasy

The server uses `noEmit: true` in `tsconfig.json` with `allowImportingTsExtensions: true`. The production build uses `server/build.mjs` (esbuild), NOT `tsc`. This means `node --test` runs TypeScript files directly via Node.js 22's native TS strip-types support. The `--experimental-test-coverage` flag works with this setup.

### Previous Story Intelligence (4-3: Dockerfiles & Docker Compose)

From story 4-3 (currently in review):
- Health check route `GET /api/healthz` was added at `server/routes/healthzRoutes.ts` with co-located test `server/routes/healthzRoutes.test.ts`
- All 80 unit tests and 4 E2E tests pass
- Lint is clean across all workspaces
- No regressions were introduced

### Existing Test Files (Context for Coverage Analysis)

**Client (8 test files):**
- `client/src/shared-types.smoke.test.ts` — shared types import validation
- `client/src/api/tasksApi.test.ts` — API client tests
- `client/src/hooks/useTasks.test.ts` — hook tests (mocks tasksApi)
- `client/src/pages/HomePage.test.tsx` — page-level integration test
- `client/src/components/ErrorBoundary.test.tsx`
- `client/src/components/TaskItem.test.tsx`
- `client/src/components/TaskInput.test.tsx`
- `client/src/components/TaskList.test.tsx`

**Server (4 test files):**
- `server/shared-types.smoke.test.ts` — shared types import validation
- `server/routes/healthzRoutes.test.ts` — health check route tests
- `server/routes/taskRoutes.test.ts` — task CRUD route tests (mocks TaskRepository)
- `server/repositories/TaskRepository.test.ts` — repository tests (in-memory SQLite)

### Project Structure Notes

- Coverage config must be added to existing files — do NOT create new config files
- `client/vite.config.ts` already has a `test` block — extend it with `coverage` key
- `server/package.json` already has `"test"` script — add `"test:coverage"` alongside it
- Root `package.json` — add `"test:coverage"` alongside existing `"test"` script
- CI workflow is at `.github/workflows/ci.yml` — add step(s) to existing `lint-and-test` job
- Coverage reports should NOT be committed to git — add `coverage/` to `.gitignore` if not already present
- Test file naming convention: co-located `.test.ts` / `.test.tsx` files (already established)

### Testing Standards Summary

Per project-context.md:
- **Mock boundaries**: Hook tests mock `tasksApi`, route tests mock `TaskRepository`, repository tests use in-memory SQLite, E2E tests mock nothing
- **Client runner**: Vitest via `vitest run` — coverage via `vitest run --coverage` (already configured)
- **Server runner**: Node.js `node:test` with `--experimental-test-module-mocks`
- **Coverage target**: ≥70% line coverage for core business logic (relaxed from original 80% in PRD FR31 per sprint change proposal)
- **Co-located tests**: every test file lives next to its source file

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.4 section]
- [Source: _bmad-output/planning-artifacts/architecture.md — Testing Standards section]
- [Source: _bmad-output/project-context.md — Testing Rules section]
- [Source: client/vite.config.ts — existing test configuration]
- [Source: client/package.json — existing test:coverage script]
- [Source: server/package.json — existing test script]
- [Source: .github/workflows/ci.yml — current CI pipeline]
- [Source: Node.js v22 docs — test runner coverage API]

### Coverage Gap Analysis

**Client Coverage (src/hooks/ and src/components/):**
| Directory | Lines | Branches | Funcs |
|-----------|-------|----------|-------|
| components/ | 97.97% | 97.43% | 100% |
| hooks/ | 100% | 84.84% | 100% |
| **Overall** | **98.61%** | **91.66%** | **100%** |

Minor uncovered paths:
- `TaskItem.tsx` lines 20-22 — defensive branch for edge-case UI state (93.18% lines)
- `useTasks.ts` lines 53-54, 57-58, 71 — error-handling branches in optimistic update rollback (84.84% branch)
- **Rationale for deferral:** All uncovered paths are defensive error-handling branches that are difficult to trigger without injecting low-level failures. Line coverage far exceeds the 70% threshold.

**Server Coverage (routes/ and repositories/):**
| File | Lines | Branches | Funcs |
|------|-------|----------|-------|
| repositories/TaskRepository.ts | 100% | 100% | 100% |
| routes/healthzRoutes.ts | 100% | 100% | 100% |
| routes/taskRoutes.ts | 100% | 100% | 100% |
| routes/schemas/taskSchemas.ts | 100% | 100% | 100% |
| plugins/errorHandler.ts | 100% | 87.50% | 100% |
| **Overall** | **100%** | **97.06%** | **100%** |

Minor uncovered path:
- `errorHandler.ts` — one branch at 87.5%, an edge case in error type detection
- **Rationale for deferral:** All source files are at 100% line coverage. The single uncovered branch is a defensive type-guard in the error handler plugin.

**Deferred testing items from code reviews (cross-reference deferred-work.md):**
- E2E tests use CSS class selectors instead of `data-testid`/ARIA — brittle but functional
- No mutation-failure E2E coverage (POST/PATCH/DELETE 500 responses)
- No test data cleanup between E2E runs
- No `@ts-expect-error` negative shape tests for type constraints
- No Playwright HTML report upload in CI

**Recommended next steps:**
- Stories 4-5 (performance), 4-6 (accessibility), and 4-7 (security) will address remaining quality gaps
- E2E selector brittleness should be addressed in a future hardening pass

### Review Findings

- [x] [Review][Patch] `run-coverage.mjs` missing `coverageIncludeGlobs` — coverage scope not restricted to `routes/` and `repositories/` [`server/run-coverage.mjs`]
- [x] [Review][Patch] Unhandled `error` event on stream — process throws uncaught exception instead of clean non-zero exit [`server/run-coverage.mjs:11`]
- [x] [Review][Defer] `run()` has no explicit files glob — auto-discovery may include non-test files [`server/run-coverage.mjs:4`] — deferred, consistent with existing `npm test` auto-discovery pattern
- [x] [Review][Defer] CI runs unit tests and coverage steps separately — tests execute twice [`/.github/workflows/ci.yml`] — deferred, by design per spec; acceptable ~30s overhead
- [x] [Review][Defer] No coverage artifact upload in CI — reports discarded after runner [`/.github/workflows/ci.yml`] — deferred, not in any AC; nice-to-have for future
- [x] [Review][Defer] Client coverage omits `reporter` config — no HTML/LCOV output configured [`client/vite.config.ts`] — deferred, not required by spec; can add when needed
- [x] [Review][Defer] Root `test:coverage` uses manual `&&` instead of `--workspaces --if-present` — new workspaces silently skipped [`package.json`] — deferred, maintenance concern, not blocking

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Debug Log References
N/A

### Completion Notes List
- Task 1: Added `coverage` config to `client/vite.config.ts` with `thresholds: { lines: 70, branches: 70 }` scoped to `src/hooks/**` and `src/components/**`. Client coverage: 98.61% lines, 91.66% branches.
- Task 2: Created `server/run-coverage.mjs` using `node:test` `run()` API with `lineCoverage: 70` threshold. The `--test-coverage-include` CLI flags caused incorrect coverage numbers when combined with `--experimental-test-module-mocks`, so the programmatic API was used instead. Server coverage: 100% lines across routes/ and repositories/.
- Task 3: Added `test:coverage` script to root `package.json` running both workspaces sequentially.
- Task 4: Added two coverage steps to `.github/workflows/ci.yml` (client + server) after the existing "Unit tests" step. Both exit non-zero if thresholds aren't met.
- Task 5: Documented coverage gap analysis in Dev Notes — client has minor uncovered branches in error handling (TaskItem lines 20-22, useTasks rollback branches), server is at 100%. Cross-referenced 5 testing-related deferred items.
- Task 6: All 81 tests pass, both coverage checks pass, zero lint errors.

### Change Log
- 2025-07-27: Implemented story 4-4 — configured coverage thresholds, added CI coverage steps, documented gap analysis

### File List
- `client/vite.config.ts` — added `coverage` config with thresholds and include patterns
- `server/package.json` — added `test:coverage` script
- `server/run-coverage.mjs` — NEW: coverage threshold enforcement script using `node:test` `run()` API
- `package.json` — added `test:coverage` monorepo script
- `.github/workflows/ci.yml` — added client and server coverage check steps
- `_bmad-output/implementation-artifacts/4-4-test-coverage-analysis.md` — updated story with gap analysis, task completion, dev agent record
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — status updated to review
