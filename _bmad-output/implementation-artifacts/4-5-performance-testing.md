# Story 4.5: Performance Testing

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want application performance analyzed and documented,
so that performance baselines are established and any issues are visible.

## Acceptance Criteria

1. **Given** Chrome DevTools or Lighthouse performance audit is run against the running application **When** the audit completes **Then** key metrics are captured: First Contentful Paint (FCP), Largest Contentful Paint (LCP), Total Blocking Time (TBT), Cumulative Layout Shift (CLS)

2. **Given** the performance metrics are reviewed **When** checked against project NFRs **Then** CLS < 0.1 (NFR4), UI interactions < 300ms (NFR1), initial load < 1.5s (NFR2) are verified or deviations documented

3. **Given** a performance report is produced **When** reviewed **Then** it documents findings, any issues found, and recommended remediations

## Tasks / Subtasks

- [x] Task 1: Create Playwright-based Lighthouse performance audit script (AC: 1)
  - [x] Install `lighthouse` as a dev dependency in the monorepo root (co-located with Playwright)
  - [x] Create `e2e/tests/performance.spec.ts` using Playwright to launch a Chromium page and run Lighthouse programmatically via `lighthouse` npm package with `chrome.debugger` port
  - [x] Capture key metrics from Lighthouse output: FCP, LCP, TBT, CLS, Performance Score, Speed Index
  - [x] Write metrics to a JSON results file at `_bmad-output/test-artifacts/performance-report.json`
  - [x] Ensure the test does NOT run as part of the default `npm run test:e2e` suite — use a Playwright project name like `performance` with `grep` filtering or a separate config, so it runs only when explicitly invoked

- [x] Task 2: Create manual interaction timing tests for UI operations (AC: 2)
  - [x] In the same `e2e/tests/performance.spec.ts` (or a dedicated `e2e/tests/interaction-timing.spec.ts`), add Playwright tests that measure wall-clock time for:
    - Create task: time from submit to task appearing in DOM
    - Toggle task: time from click to completed class/style change
    - Delete task: time from click to task removal from DOM
  - [x] Assert each interaction completes within 300ms (NFR1)
  - [x] Use `performance.now()` or Playwright's built-in timing APIs for measurement

- [x] Task 3: Verify NFR thresholds against Lighthouse results (AC: 2)
  - [x] Parse Lighthouse results and check:
    - CLS < 0.1 (NFR4) — measured 0.0088, PASS
    - FCP + LCP indicating initial load < 1.5s (NFR2) — LCP 10ms, PASS (no throttling baseline)
    - Performance Score ≥ 90 as a general health indicator (informational, not hard gate) — scored 100/100
  - [x] If any NFR threshold is exceeded, document the deviation with root cause analysis and recommended remediation
  - [x] If all NFRs pass, document the pass with actual measured values

- [x] Task 4: Generate performance report document (AC: 3)
  - [x] Create `_bmad-output/test-artifacts/performance-report.md` documenting:
    - Date of audit, environment details (Node.js version, browser, local dev vs Docker)
    - All captured Lighthouse metrics (FCP, LCP, TBT, CLS, SI, Performance Score)
    - NFR compliance matrix (NFR1, NFR2, NFR4 — pass/fail with measured values)
    - Interaction timing results (create, toggle, delete — measured ms vs 300ms threshold)
    - Any issues found with severity rating
    - Recommended remediations for any failures or near-threshold results
    - Baseline establishment note for future regression tracking
  - [x] Cross-reference deferred-work.md for any performance-related deferred items

- [x] Task 5: Run full test suite to verify no regressions (AC: 1, 2, 3)
  - [x] Run `npm test --workspaces` — all 81 tests pass (57 client + 24 server)
  - [x] Run `npm run lint --workspaces --if-present` — zero lint errors
  - [x] Run performance test explicitly — 4/4 perf tests pass (Lighthouse + 3 interactions)
  - [x] Verify no new dependencies conflict with existing workspace packages — lighthouse@13.1.0 installed cleanly

## Dev Notes

### CRITICAL: This Story is Analysis & Documentation — Not Feature Code

This story produces **test scripts and a report document**, not production application code. No existing source files should be modified except to add test scripts and documentation. The running application must not be changed.

### CRITICAL: Lighthouse Integration with Playwright

The recommended approach is to use the `lighthouse` npm package programmatically within a Playwright test. Playwright launches Chromium with remote debugging enabled, and Lighthouse connects to that debug port.

**Pattern:**
```typescript
import { test } from '@playwright/test';
import lighthouse from 'lighthouse';

test('Lighthouse performance audit', async ({ browser }) => {
  // Launch browser with remote debugging
  // Connect Lighthouse to the debug port
  // Run audit against http://localhost:5173
  // Extract metrics from result.lhr.audits
});
```

**Key consideration:** Lighthouse requires a fresh Chromium instance with `--remote-debugging-port`. Playwright's default browser context may conflict. Two approaches:

1. **Recommended — Direct Lighthouse launch:** Use `lighthouse` with its built-in Chrome launcher (`chromeLauncher`), separate from the Playwright browser. This avoids conflicts.
2. **Alternative — Playwright CDP:** Launch Playwright's Chromium with `--remote-debugging-port=9222` and pass the port to Lighthouse. More complex but reuses Playwright's browser management.

### CRITICAL: Test Isolation from Default E2E Suite

Performance tests must NOT run as part of `npm run test:e2e` (which runs the functional E2E tests). Options:

1. **Separate Playwright config:** Create `e2e/playwright.perf.config.ts` extending the base config but with `testMatch: '**/performance*.spec.ts'`
2. **Add `npm run test:perf` script** to root `package.json`: `playwright test --config e2e/playwright.perf.config.ts`
3. **Use `test.describe` with tags** and `--grep` filtering

Option 1 is recommended for clean separation — it reuses `webServer` config from the base but scopes test discovery.

### CRITICAL: NFR Definitions (from PRD)

| NFR | Requirement | Metric | Source |
|-----|------------|--------|--------|
| NFR1 | UI interactions (create, toggle, delete) complete within 300ms | Wall-clock time per operation | PRD Performance |
| NFR2 | Initial application load within 1.5s on standard broadband | FCP + LCP (Lighthouse) | PRD Performance |
| NFR4 | CLS < 0.1 throughout all user interactions | CLS score (Lighthouse) | PRD Performance |
| NFR3 | API responses within 200ms | Server-side response time | PRD Performance (informational — server-side, not directly Lighthouse) |
| NFR5 | No main thread blocking during rendering | TBT (Lighthouse) | PRD Performance (informational) |

**Note:** NFR1 (interaction timing) is best measured via Playwright interaction tests, NOT Lighthouse. Lighthouse measures page load performance, not runtime interaction speed. The two approaches are complementary.

### CRITICAL: Application URLs for Testing

- **Client dev server:** `http://localhost:5173` (Vite dev server)
- **Server dev server:** `http://localhost:3000` (Fastify)
- **Playwright baseURL:** `http://localhost:5173` (from `e2e/playwright.config.ts`)
- **webServer config** in `playwright.config.ts` auto-starts both servers — reuse this in the perf config

### CRITICAL: Existing Playwright Setup

The existing Playwright config (`e2e/playwright.config.ts`) uses:
- `testDir: './tests'`
- `baseURL: 'http://localhost:5173'`
- Chromium desktop project only
- `webServer` array starts both client (port 5173) and server (port 3000)
- `reuseExistingServer: !process.env.CI`

The performance config should inherit webServer settings. Either import from the base config or duplicate the webServer array.

### CRITICAL: No CI Integration Required

The epic scope for 4.5 is **local performance analysis and documentation**. There is no acceptance criteria requiring CI pipeline integration for performance tests. The test script should be runnable locally on demand. A `test:perf` convenience script in `package.json` is sufficient.

### Previous Story Intelligence (4-4: Test Coverage Analysis)

From story 4-4 (in review):
- `server/run-coverage.mjs` was created using `node:test` `run()` API — programmatic approach preferred over CLI flags
- Coverage thresholds configured in `client/vite.config.ts` under `test.coverage`
- CI workflow updated at `.github/workflows/ci.yml`
- All 81 tests pass, zero lint errors
- **Review findings:** Two patches pending on `server/run-coverage.mjs` (missing `coverageIncludeGlobs` and unhandled `error` event)

### Git Intelligence

Recent commits (most relevant):
- `5aaed2f` feat: Implement Task Management Features and Error Handling (latest — large commit with frontend features)
- `62d6cb3` feat: implement `useTasks` hook
- `394333a` feat: implement unit tests for task route handlers
- Pattern: Feature commits include co-located tests; no separate test-only commits

### Project Structure Notes

- Performance test file: `e2e/tests/performance.spec.ts` — co-located with existing E2E tests
- Performance Playwright config: `e2e/playwright.perf.config.ts` — alongside existing `e2e/playwright.config.ts`
- Performance report output: `_bmad-output/test-artifacts/performance-report.md` (human-readable) and `_bmad-output/test-artifacts/performance-report.json` (machine-readable)
- New npm script at root: `test:perf` — runs `playwright test --config e2e/playwright.perf.config.ts`
- `lighthouse` package added as root devDependency (alongside `@playwright/test`)
- No existing source files modified — this story is purely additive (new test files + report)

### Deferred Work Context

Relevant items from `deferred-work.md`:
- **gzip/brotli compression missing from nginx config** — may affect Lighthouse metrics when testing Docker setup vs dev server. Test against dev server for consistent baseline.
- **nginx missing security headers** — no performance impact, but Lighthouse may flag in Best Practices category
- **E2E tests use CSS class selectors** — interaction timing tests should use the same selectors as existing E2E tests for consistency

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.5 section]
- [Source: _bmad-output/planning-artifacts/prd.md — NFR1, NFR2, NFR3, NFR4, NFR5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Testing Standards, Tech Stack]
- [Source: _bmad-output/project-context.md — Testing Rules, Framework-Specific Rules]
- [Source: e2e/playwright.config.ts — existing Playwright configuration]
- [Source: _bmad-output/implementation-artifacts/4-4-test-coverage-analysis.md — previous story learnings]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — performance-related deferred items]
- [Source: Lighthouse npm docs — programmatic API usage]

## Dev Agent Record

### Agent Model Used
Claude Opus 4.6 (GitHub Copilot)

### Debug Log References
N/A

### Completion Notes List
- Task 1: Created `e2e/tests/performance.spec.ts` with Lighthouse audit using `chrome-launcher` for Chrome instance management. Lighthouse runs with desktop form factor, no throttling (local baseline). Separate `e2e/playwright.perf.config.ts` isolates perf tests from default E2E suite via `testIgnore` in main config.
- Task 2: Added 3 interaction timing tests in same file measuring create/toggle/delete against 300ms NFR1 threshold. Used same DOM selectors as existing E2E tests for consistency. All interactions complete in 16-60ms.
- Task 3: NFR verification built into test assertions and JSON report. All NFRs pass: CLS 0.0088 (< 0.1), LCP 10ms (< 1500ms), TBT 0ms (< 300ms), interactions max 60ms (< 300ms). Performance Score: 100/100.
- Task 4: Generated `_bmad-output/test-artifacts/performance-report.md` with full metrics, NFR compliance matrix, baseline values, and cross-referenced deferred work items.
- Task 5: Full regression suite passes — 81 unit tests, 17 E2E tests, zero lint errors. lighthouse@13.1.0 installed without conflicts.

### Change Log
- 2026-04-28: Implemented story 4-5 — Lighthouse performance audit, interaction timing tests, NFR verification, performance report

### File List
- `e2e/tests/performance.spec.ts` — NEW: Lighthouse audit + interaction timing tests
- `e2e/playwright.perf.config.ts` — NEW: separate Playwright config for performance tests
- `e2e/playwright.config.ts` — MODIFIED: added `testIgnore` to exclude performance tests from default suite
- `package.json` — MODIFIED: added `test:perf` script, `lighthouse` devDependency
- `_bmad-output/test-artifacts/performance-report.json` — NEW: machine-readable performance results
- `_bmad-output/test-artifacts/performance-report.md` — NEW: human-readable performance report
- `_bmad-output/implementation-artifacts/4-5-performance-testing.md` — MODIFIED: task completion, dev agent record
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIED: story status updated

### Review Findings

- [x] [Review][Patch] `si` (Speed Index) and `perfScore` (Performance Score) not asserted not-null — AC1 specifies Speed Index and Performance Score must be captured; the test extracts them but only asserts FCP, LCP, TBT, CLS not-null. Fix: add `expect(si).not.toBeNull()` and `expect(perfScore).not.toBeNull()` to the assertion block [`e2e/tests/performance.spec.ts:145`]
- [x] [Review][Defer] `appendInteractionTiming` merge-vs-overwrite ordering assumption — Lighthouse test overwrites the full JSON; interaction tests merge into it. Safe for normal `npm run test:perf` (sequential within-file order), but partial `--grep` runs produce incomplete JSON. Low risk for a local analysis tool. [`e2e/tests/performance.spec.ts:8`]
- [x] [Review][Defer] `process.cwd()` for REPORT_DIR — Works when run from monorepo root; would silently write to wrong path if run from `e2e/` directory directly. Low risk given documented `npm run test:perf` entrypoint. [`e2e/tests/performance.spec.ts:5`]
- [x] [Review][Defer] `test:a11y`, `@axe-core/playwright`, and `test:coverage` changes in `package.json` diff belong to stories 4-6 and 4-4 — not part of 4-5 scope; will be reviewed when those stories are reviewed [`package.json`]
