# Story 4.6: Accessibility Testing

Status: done

## Story

As a developer,
I want automated accessibility audits run against the application,
so that WCAG 2.1 Level AA compliance is verified and violations are documented.

## Acceptance Criteria

1. **Given** an accessibility audit is run using axe-core (via Playwright)
   **When** the audit completes
   **Then** results are captured covering: color contrast, keyboard navigation, ARIA attributes, focus management, semantic HTML

2. **Given** the audit results are reviewed
   **When** checked against project NFRs
   **Then** WCAG 2.1 Level A compliance (NFR14) is verified; Level AA findings are documented as stretch

3. **Given** violations are found
   **When** reviewed
   **Then** each violation is categorized by severity and has a documented remediation plan or deferral justification

## Tasks / Subtasks

- [x] Task 1: Install `@axe-core/playwright` dependency (AC: #1)
  - [x] 1.1 `npm install --save-dev @axe-core/playwright` at monorepo root (alongside `@playwright/test`)
- [x] Task 2: Create accessibility audit E2E spec (AC: #1)
  - [x] 2.1 Create `e2e/tests/accessibility.spec.ts` with axe-core Playwright integration
  - [x] 2.2 Test empty state page (no tasks) for a11y violations
  - [x] 2.3 Test page with active tasks for a11y violations
  - [x] 2.4 Test page with completed tasks for a11y violations
  - [x] 2.5 Test error state for a11y violations (API failure banner)
  - [x] 2.6 Use `withTags(['wcag2a', 'wcag2aa'])` to audit both Level A and Level AA
- [x] Task 3: Verify NFR10–14 compliance programmatically (AC: #2)
  - [x] 3.1 Keyboard navigation test: Tab through all interactive elements, verify focus order
  - [x] 3.2 Focus visibility test: verify focus ring styles applied via `:focus-visible`
  - [x] 3.3 ARIA test: verify `aria-label` on icon-only controls, `role="alert"` on error banner, `role="status"` on loading, `aria-label` on sections
  - [x] 3.4 Semantic HTML test: verify heading hierarchy (`h2` in task list), landmark regions (`main`)
- [x] Task 4: Separate Level A (must-pass) from Level AA (documented stretch) (AC: #2)
  - [x] 4.1 Create a test that runs `withTags(['wcag2a'])` and asserts ZERO violations (hard fail)
  - [x] 4.2 Create a test that runs `withTags(['wcag2aa'])` and logs violations without hard fail, documenting them in test output
- [x] Task 5: Fix any Level A violations discovered (AC: #1, #2)
  - [x] 5.1 Review axe-core output for Level A violations and apply fixes to components/styles
  - [x] 5.2 Re-run audit to confirm zero Level A violations
- [x] Task 6: Document findings and remediation plan (AC: #3)
  - [x] 6.1 Create `_bmad-output/implementation-artifacts/4-6-accessibility-audit-report.md` documenting all findings
  - [x] 6.2 Categorize each violation by severity (critical/serious/moderate/minor)
  - [x] 6.3 For each violation: document remediation applied OR deferral justification
  - [x] 6.4 Include known deferred items from previous stories (checkbox tap area, missing `<h1>`, hardcoded colors)
- [x] Task 7: Add npm script for accessibility tests (AC: #1)
  - [x] 7.1 Add `"test:a11y": "playwright test --config e2e/playwright.config.ts e2e/tests/accessibility.spec.ts"` to root `package.json`

## Dev Notes

### Technology Choice: `@axe-core/playwright` over Lighthouse

The story AC mentions "Lighthouse or axe-core (via Playwright)". **Use `@axe-core/playwright` v4.11.2** — it integrates directly with the existing Playwright test infrastructure, runs headlessly in CI, and provides programmatic control over WCAG tag filtering (`wcag2a`, `wcag2aa`). Lighthouse would require a separate Chrome process and is primarily for performance auditing; axe-core is purpose-built for accessibility compliance testing.

### `@axe-core/playwright` Usage Pattern

```typescript
import { AxeBuilder } from '@axe-core/playwright'
import { test, expect } from '../fixtures'

test('should have no WCAG 2.1 Level A violations', async ({ page }) => {
  await page.goto('/')
  // Wait for app to render (tasks loaded)
  await page.waitForSelector('.task-list')

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a'])
    .analyze()

  expect(results.violations).toEqual([])
})
```

### Key API Methods

- `new AxeBuilder({ page })` — constructor, takes Playwright `Page` instance
- `.withTags(['wcag2a', 'wcag2aa'])` — filter rules by WCAG conformance level
- `.exclude('.selector')` — exclude elements from analysis if needed
- `.analyze()` — returns `Promise<axe.Results>` with `violations`, `passes`, `incomplete`, `inapplicable`
- Each violation has: `id`, `impact` (critical/serious/moderate/minor), `description`, `helpUrl`, `nodes[]`

### NFR Requirements to Verify (from PRD)

| NFR | Requirement | How to Verify |
|-----|-------------|---------------|
| NFR10 | All interactive elements reachable/operable via keyboard alone | Playwright keyboard navigation test (Tab/Enter/Space) |
| NFR11 | Visible focus indicator ≥3:1 contrast | axe-core `focus-visible` rules + manual CSS verification |
| NFR12 | All images/icon-only controls have text alternatives | axe-core `button-name`, `image-alt` rules |
| NFR13 | Async status changes announced via ARIA live regions | Verify `role="alert"` on error banner, `role="status"` on loading |
| NFR14 | No WCAG 2.1 Level A violations | axe-core `.withTags(['wcag2a'])` → zero violations |

### Current A11y State of the Codebase

The app already has significant accessibility work baked in from earlier stories:

**Good (already implemented):**
- `TaskItem`: checkbox has `id`/`htmlFor` label association, delete button has `aria-label="Delete task"`
- `TaskInput`: input has `<label htmlFor="task-input">`, add button has `aria-label="Add task"`
- `TaskList`: loading state uses `role="status"`, error banner uses `role="alert"`, sections use `aria-label`
- `ErrorBoundary`: uses `role="alert"`
- `index.css`: `:focus-visible` outlines with `#0057b8` (2px solid, offset 2px), 44×44px touch targets
- `index.html`: `<html lang="en">` set

**Known Issues (deferred from previous stories — expect these in audit):**
1. **Checkbox tap area (from 3-7):** `min-width/min-height: 44px` on native `[type="checkbox"]` does not reliably enlarge tap area in WebKit/Safari — visual checkbox may remain ~16×16px. axe-core won't catch this (it's a rendering issue, not DOM issue).
2. **Missing `<h1>` (from 3-7):** `HomePage.tsx` has no visible `<h1>` page heading. Not required by WCAG 2.1 Level A (heading hierarchy is Level AA), but axe-core may flag under `page-has-heading-one` (best practice, not a hard WCAG criterion).
3. **Hardcoded hex colors (from 3-5):** `#444`, `#888`, `#721c24` — no CSS variable system or contrast verification. axe-core `color-contrast` rule will evaluate these.
4. **`<title>` is "client" (from index.html):** Should be descriptive. axe-core `document-title` rule (WCAG 2.1 Level A, SC 2.4.2) will likely flag this as non-descriptive. **Must fix.**

### Potential Level A Violations to Fix

Based on code analysis, these are likely to be flagged:

1. **`<title>client</title>`** — non-descriptive page title. Fix: change to `<title>Todo App</title>` in `client/index.html`. (WCAG 2.4.2 — Level A)
2. **Color contrast** — `#888` text on white background (#888 on #fff = ~3.5:1, passes AA for large text but may fail for small body text). `#666` on white = ~5.7:1 (passes). Error banner `#721c24` on `#fff0f0` needs verification.
3. **`TaskInput` has redundant `aria-label`** — both `<label htmlFor>` AND `aria-label` are set. Not a violation but redundant; the `aria-label` overrides the visible label which is an anti-pattern. Consider removing the `aria-label` since the `<label>` already provides the accessible name.

### File Structure

```
e2e/
  tests/
    accessibility.spec.ts        ← NEW: axe-core accessibility audit specs

client/
  index.html                     ← UPDATE: fix <title> tag

_bmad-output/implementation-artifacts/
  4-6-accessibility-audit-report.md  ← NEW: findings documentation
```

### Testing Approach

- **Test framework:** Playwright with `@axe-core/playwright` — co-located with existing E2E tests in `e2e/tests/`
- **No new test framework required** — axe-core runs within existing Playwright infrastructure
- **Test structure:** One spec file with multiple test cases covering different app states
- **Hard fail vs. soft fail:** Level A tests MUST have zero violations (test assertion fails). Level AA tests log violations and document them but do not fail the test run.
- **CI consideration:** These tests will run with `npm run test:e2e` since they're in the `e2e/tests/` directory. They follow the same `webServer` config (starts both Vite + Fastify before running).

### Project Structure Notes

- `@axe-core/playwright` is installed at monorepo root alongside `@playwright/test` (same `devDependencies` scope)
- Accessibility spec follows same pattern as existing E2E tests: imports from `../fixtures`, uses `page.goto('/')`, same Playwright config
- Audit report goes in `implementation-artifacts/` alongside other story artifacts
- No changes to `client/` build configuration or `server/` needed (except potential HTML fixes)

### Previous Story Intelligence

**From 4-4 (Test Coverage Analysis, currently in review):**
- 81 total tests (57 client + 24 server) + 4 E2E
- E2E tests use CSS class selectors instead of `data-testid`/ARIA — noted as brittle but functional
- Agent used programmatic API for `node:test` coverage because CLI flags had issues with `--experimental-test-module-mocks`

**From 4-3 (Docker, done):**
- 80 unit + 4 E2E all pass
- Review produced 8 patches — be thorough in self-review before marking complete

**From deferred-work.md relevant items:**
- Replace CSS class selectors with `data-testid` or ARIA role selectors in E2E (from 4-1)
- Checkbox tap area issue in WebKit (from 3-7)
- Missing `<h1>` (from 3-7)
- Hardcoded hex colors, no contrast verification (from 3-5)
- Missing nginx security headers (from 4-3)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Story 4.6 Acceptance Criteria]
- [Source: _bmad-output/planning-artifacts/sprint-change-proposal-2026-04-28.md — Story 4D definition]
- [Source: _bmad-output/planning-artifacts/prd.md — NFR10-14 Accessibility requirements]
- [Source: _bmad-output/planning-artifacts/prd.md — FR20-24 Accessibility & Navigation]
- [Source: _bmad-output/planning-artifacts/architecture.md — NFR10-14 cross-cutting accessibility strategy]
- [Source: _bmad-output/project-context.md — Accessibility baked-in rules, anti-patterns]
- [Source: _bmad-output/implementation-artifacts/deferred-work.md — Deferred a11y items]
- [Source: npmjs.com/@axe-core/playwright v4.11.2 — API documentation]

### Review Findings

- [x] [Review][Patch] Tab order test now verifies sequential focus order (input→add→checkbox→delete) [accessibility.spec.ts:163-175]
- [x] [Review][Patch] Focus indicator test now checks all interactive elements (input, add button, checkbox, delete) [accessibility.spec.ts:222-255]
- [x] [Review][Patch] Semantic HTML test now toggles task and verifies both Active and Completed h2 headings [accessibility.spec.ts:316-349]
- [x] [Review][Defer] No test cleanup / orphaned tasks accumulate — pre-existing pattern across all E2E tests
- [x] [Review][Defer] `test:perf` and `test:coverage` scripts in package.json — out-of-scope (stories 4-4, 4-5)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

### Completion Notes List

- Installed `@axe-core/playwright` v4.11.2 at monorepo root
- Created comprehensive accessibility test spec (13 tests) covering:
  - 4 Level A audits across all page states (empty, active, completed, error)
  - 1 Level AA audit with violation logging (stretch goal)
  - 8 NFR compliance verification tests (keyboard, focus, ARIA, semantic HTML)
- All WCAG 2.1 Level A tests pass with ZERO violations
- All WCAG 2.1 Level AA tests pass with zero violations (stretch goal achieved)
- NFR10–14 compliance verified programmatically
- Fixed `<title>` from "client" to "Todo App" for WCAG SC 2.4.2 compliance
- Created audit report documenting findings, remediation, and deferred items
- Added `npm run test:a11y` script for standalone accessibility test execution
- All 17 E2E tests pass (4 original + 13 new), 81 unit tests pass, lint clean

### Change Log

- 2026-04-28: Story implementation complete. 13 accessibility tests added, title fix applied, audit report documented.

### File List

- `package.json` — MODIFIED: added `@axe-core/playwright` devDependency and `test:a11y` script
- `e2e/tests/accessibility.spec.ts` — NEW: 13 accessibility audit and NFR compliance E2E tests
- `client/index.html` — MODIFIED: `<title>` changed from "client" to "Todo App"
- `_bmad-output/implementation-artifacts/4-6-accessibility-audit-report.md` — NEW: accessibility audit findings report
