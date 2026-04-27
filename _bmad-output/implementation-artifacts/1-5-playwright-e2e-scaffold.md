# Story 1.5: Playwright E2E Scaffold

Status: done

## Story

As a developer,
I want a Playwright E2E scaffold at the monorepo root with stub spec files,
so that full-stack end-to-end tests can be written against the running stack once features are complete.

## Acceptance Criteria

1. **Given** `e2e/playwright.config.ts` exists **When** reviewed **Then** it defines `webServer` entries for both client (port 5173) and server (port 3000), sets `testDir` to `./tests`, and sets a reasonable `timeout`
2. **Given** `e2e/fixtures/index.ts` exists **When** reviewed **Then** it exports a test fixture extending Playwright's base `test` (stub is sufficient at this stage)
3. **Given** `e2e/tests/` contains stub spec files **When** reviewed **Then** `createTask.spec.ts`, `completeTask.spec.ts`, `deleteTask.spec.ts`, and `apiFailure.spec.ts` each exist with a placeholder `test.todo()` or empty describe block
4. **Given** `@playwright/test` 1.59.1 is installed as a root devDependency **When** `npx playwright --version` is run at the monorepo root **Then** it reports version 1.59.1 (or compatible)

## Tasks / Subtasks

- [x] Task 1 — Update root `package.json` test:e2e scripts (AC: 1, 4)
  - [x] Change `"test:e2e": "playwright test"` → `"test:e2e": "playwright test --config e2e/playwright.config.ts"`
  - [x] Change `"test:e2e:ui": "playwright test --ui"` → `"test:e2e:ui": "playwright test --ui --config e2e/playwright.config.ts"`
  - [x] Rationale: config lives at `e2e/playwright.config.ts`, NOT monorepo root — without `--config`, `playwright test` won't find it

- [x] Task 2 — Install Playwright browser binaries (AC: 4)
  - [x] Run `npx playwright install chromium` from monorepo root (chromium is sufficient for stub scaffold; `--with-deps` is used in CI via e2e.yml)
  - [x] Verify `npx playwright --version` reports `1.59.1`

- [x] Task 3 — Create `e2e/playwright.config.ts` (AC: 1)
  - [x] Create directory `e2e/` at monorepo root
  - [x] `webServer` must be an **array** with two entries: client on port 5173, server on port 3000
  - [x] Client command: `npm run dev -w client` (runs from monorepo root via npm workspace flag)
  - [x] Server command: `npm run dev -w server`
  - [x] Set `reuseExistingServer: !process.env.CI` on both entries (reuse in local dev, fresh in CI)
  - [x] Set `testDir: './tests'` (resolves relative to config file → `e2e/tests/`)
  - [x] Set `use.baseURL: 'http://localhost:5173'`
  - [x] Set `timeout: 30000` (30 s per test; reasonable for full-stack stub)
  - [x] Set `reporter: 'html'`

- [x] Task 4 — Create `e2e/fixtures/index.ts` (AC: 2)
  - [x] Exports `test` and `expect` directly from `@playwright/test` (stub — no custom fixtures needed until Epic 4)

- [x] Task 5 — Create stub spec files in `e2e/tests/` (AC: 3)
  - [x] `e2e/tests/createTask.spec.ts` — `test.fixme` placeholder (AC: 3; `test.todo` not available in Playwright 1.59.1)
  - [x] `e2e/tests/completeTask.spec.ts` — `test.fixme` placeholder
  - [x] `e2e/tests/deleteTask.spec.ts` — `test.fixme` placeholder
  - [x] `e2e/tests/apiFailure.spec.ts` — `test.fixme` placeholder
  - [x] Each spec imports `{ test }` from `'@playwright/test'` directly

- [x] Task 6 — Verify the scaffold runs cleanly (AC: 1–4)
  - [x] `npx playwright test --config e2e/playwright.config.ts --list` lists 4 tests in 4 files — exit 0
  - [x] All 10 unit tests across client + server pass — exit 0 (no regressions)

## Dev Notes

### Critical: Config Path Must Be Explicit

`playwright test` without a `--config` flag looks for `playwright.config.ts` in the **current working directory** (monorepo root). Because the architecture places the config at `e2e/playwright.config.ts`, these two root scripts in `package.json` **must be updated**:

| Script | Before (Story 1.1 scaffold) | After (this story) |
|--------|-----------------------------|--------------------|
| `test:e2e` | `playwright test` | `playwright test --config e2e/playwright.config.ts` |
| `test:e2e:ui` | `playwright test --ui` | `playwright test --ui --config e2e/playwright.config.ts` |

### `webServer` Commands Run From Monorepo Root

When `playwright test --config e2e/playwright.config.ts` is invoked from the monorepo root, `webServer.command` is also executed from the **monorepo root**. Use npm workspace flags:

```
command: 'npm run dev -w client'   → runs client/package.json "dev": "vite"
command: 'npm run dev -w server'   → runs server/package.json "dev": "fastify start -l info -P app.ts"
```

Do **not** use relative `cd client && npm run dev` — fragile across environments.

### `testDir` Resolves Relative to Config File

With config at `e2e/playwright.config.ts` and `testDir: './tests'`, Playwright resolves tests at `e2e/tests/`. This is the expected structure per architecture.

### `.gitignore` Is Already Correct

The root `.gitignore` already contains:
```
playwright-report/
test-results/
.playwright/
```
These glob patterns match at any depth — they cover both `playwright-report/` at root and `e2e/playwright-report/`. **No `.gitignore` changes needed.**

### Playwright Browser Binaries

`@playwright/test` 1.59.1 is already installed (confirmed via `npx playwright --version → 1.59.1`). However, **browser binaries may not be installed yet** — they must be installed separately:

- Local dev: `npx playwright install chromium` (chromium-only is sufficient for this scaffold)
- CI (e2e.yml, Story 1.6): `npx playwright install --with-deps` (installs all browsers + OS deps)

### React Version Discrepancy (Pre-existing)

`client/package.json` shows `"react": "^19.2.5"` — however `project-context.md` states React 18.x. This is a pre-existing scaffold delta from Story 1.2 and has no impact on this story (Playwright tests the browser, not React version). Log for awareness only.

### Deferred Items (Carry-Over from 1-4 Code Review)

The following items from the deferred-work log exist in the codebase but are **out of scope** for this story — do not fix them here:
- Missing `fastify-cli` / `eslint` in `server/package.json` devDependencies
- `--ext .ts` ESLint flag incompatibility with ESLint v9
- No CI-integrated test script for `shared/types.test.ts`

### Project Structure Notes

New files created by this story:
```
e2e/
├── playwright.config.ts     ← NEW
├── fixtures/
│   └── index.ts             ← NEW
└── tests/
    ├── createTask.spec.ts   ← NEW (stub)
    ├── completeTask.spec.ts ← NEW (stub)
    ├── deleteTask.spec.ts   ← NEW (stub)
    └── apiFailure.spec.ts   ← NEW (stub)
```

Modified files:
```
package.json   ← UPDATE test:e2e and test:e2e:ui scripts
```

### Reference Implementations

**playwright.config.ts pattern** (webServer array with two entries):
```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command: 'npm run dev -w client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
    {
      command: 'npm run dev -w server',
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
```

**fixtures/index.ts pattern** (stub):
```typescript
import { test as base, expect } from '@playwright/test'

export const test = base.extend({
  // Custom fixtures will be added here in Epic 4
})

export { expect }
```

**Spec stub pattern** (e.g. `createTask.spec.ts`):
```typescript
import { test } from '../fixtures'

test.todo('Create a task → appears in active list')
```

### References

- Architecture `webServer` config: [architecture.md](../planning-artifacts/architecture.md#testing-strategy)
- Architecture project structure: [architecture.md](../planning-artifacts/architecture.md#complete-project-directory-structure)
- Story AC source: [epics.md](../planning-artifacts/epics.md#story-15-playwright-e2e-scaffold)
- Root `package.json` scripts: [package.json](../../package.json)
- Deferred carry-overs: [deferred-work.md](deferred-work.md)

## Review Findings

- [x] [Review][Decision] AC2 compliance: accepted re-export as meeting AC2 intent — stub fixture, no custom properties yet; `base.extend({})` deferred to Epic 4 when real fixtures are added [`e2e/fixtures/index.ts:3`]
- [x] [Review][Patch] Specs bypass `fixtures/index.ts` — all 4 spec files now import from `'../fixtures'` instead of `@playwright/test` directly; Epic 4 fixtures will inject correctly [`e2e/tests/*.spec.ts:1`]
- [x] [Review][Patch] `forbidOnly: !!process.env.CI` added — `test.only()` now causes CI failure [`e2e/playwright.config.ts`]
- [x] [Review][Patch] Reporter changed to `[['html'], ['list']]` — CI runs now emit terminal output alongside the HTML report [`e2e/playwright.config.ts:7`]
- [x] [Review][Defer] `baseURL` hardcoded, no env-var override — breaks in Docker / remote environments; acceptable for single-dev local scaffold [`e2e/playwright.config.ts:10`] — deferred, pre-existing
- [x] [Review][Defer] `reuseExistingServer: !process.env.CI` is falsy when `CI=''` — edge case in some CI systems; most set `CI=true` or `CI=1` so impact is low [`e2e/playwright.config.ts:20,25`] — deferred, pre-existing
- [x] [Review][Defer] No `outputDir` configured — `test-results/` lands at monorepo root; scoping under `e2e/` would be cleaner; gitignore already covers root-level `test-results/` [`e2e/playwright.config.ts`] — deferred, pre-existing
- [x] [Review][Defer] No `retries` setting — acceptable for stub scaffold; add when real tests are written in Epic 4 [`e2e/playwright.config.ts`] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

Claude Sonnet 4.6

### Debug Log References

- `test.todo` does not exist in Playwright 1.59.1 — confirmed via `node -e "require('@playwright/test').test.todo"` → `undefined`. Used `test.fixme` instead (marks test as "known broken / not yet implemented", equivalent intent).
- `fixtures/index.ts` initially used `base.extend({})` but the extended test object does not forward static methods like `todo`/`fixme` in this Playwright version. Simplified to direct re-export: `export { test, expect } from '@playwright/test'`. Specs import directly from `@playwright/test` (acceptable since no custom fixtures exist at this stage).

### Completion Notes List

- AC1 ✅ `e2e/playwright.config.ts` created with two `webServer` entries (ports 5173 + 3000), `testDir: './tests'`, `timeout: 30_000`, `use.baseURL: 'http://localhost:5173'`, `reporter: 'html'`
- AC2 ✅ `e2e/fixtures/index.ts` re-exports `test` and `expect` from `@playwright/test` (stub for Epic 4 expansion)
- AC3 ✅ Four stub spec files in `e2e/tests/` each with a `test.fixme` placeholder covering all 4 E2E journeys
- AC4 ✅ `@playwright/test` 1.59.1 confirmed installed; Chromium binaries installed via `npx playwright install chromium`
- Root `package.json` `test:e2e` and `test:e2e:ui` scripts updated with `--config e2e/playwright.config.ts`
- `npx playwright test --config e2e/playwright.config.ts --list` → 4 tests in 4 files, exit 0
- All 10 unit tests (5 client + 5 server) pass — no regressions

### File List

- e2e/playwright.config.ts (new)
- e2e/fixtures/index.ts (new)
- e2e/tests/createTask.spec.ts (new)
- e2e/tests/completeTask.spec.ts (new)
- e2e/tests/deleteTask.spec.ts (new)
- e2e/tests/apiFailure.spec.ts (new)
- package.json (modified — test:e2e, test:e2e:ui scripts)
