# Accessibility Audit Report — Story 4.6

**Date:** 2026-04-28
**Tool:** @axe-core/playwright v4.11.2
**Standard:** WCAG 2.1 Level A (mandatory) + Level AA (stretch)
**Audited Pages:** Empty state, Active tasks, Completed tasks, Error state

---

## Summary

| Level | Violations Found | Status |
|-------|-----------------|--------|
| WCAG 2.1 Level A | 0 | ✅ PASS — Zero automated violations |
| WCAG 2.1 Level AA | 0 | ✅ PASS — No automated violations found |

**Result:** The application passes all automated WCAG 2.1 Level A and Level AA checks via axe-core across all tested page states.

---

## NFR Compliance Verification

| NFR | Requirement | Result | Notes |
|-----|-------------|--------|-------|
| NFR10 | Keyboard operability | ✅ PASS | All interactive elements (input, buttons, checkboxes) are focusable and operable via Tab/Enter/Space |
| NFR11 | Focus indicator ≥3:1 contrast | ✅ PASS | `:focus-visible` styles applied with `#0057b8` 2px solid outline (offset 2px) |
| NFR12 | Text alternatives on icon-only controls | ✅ PASS | Delete button has `aria-label="Delete task"`, Add button has `aria-label="Add task"` |
| NFR13 | ARIA live regions for async changes | ✅ PASS | Error banner uses `role="alert"`, loading state uses `role="status"` |
| NFR14 | No WCAG 2.1 Level A violations | ✅ PASS | axe-core `withTags(['wcag2a'])` returns zero violations |

---

## Remediation Applied

| Issue | Severity | Action | File |
|-------|----------|--------|------|
| `<title>client</title>` — non-descriptive page title | Minor | Changed to `<title>Todo App</title>` | `client/index.html` |

---

## Known Deferred Items (from previous stories)

These items were identified in earlier stories and are documented here with deferral justification:

| Issue | Source Story | Severity | Deferral Justification |
|-------|-------------|----------|----------------------|
| Checkbox tap area not reliably enlarged in WebKit/Safari | 3-7 | Minor | `min-width/min-height: 44px` on native checkbox doesn't reliably enlarge visual tap area in WebKit. This is a rendering issue not detectable by axe-core. Requires CSS `::after` overlay or custom checkbox — defer to design/accessibility hardening pass. |
| No visible `<h1>` page heading | 3-7 | Minor | Not required by WCAG 2.1 Level A. `page-has-heading-one` is a best practice recommendation, not a WCAG criterion. Defer to future UX/design-token pass. |
| Hardcoded hex colors without CSS variable system | 3-5 | Moderate | Colors `#444`, `#888`, `#721c24` are used directly. axe-core did NOT flag color contrast violations (all tested colors pass contrast ratios). No CSS variable system exists but this is a maintainability concern, not an accessibility violation. Defer to global styling/design-token pass. |
| Redundant `aria-label` on TaskInput | — | Minor | Both `<label htmlFor="task-input">` and `aria-label="New task"` are set. The `aria-label` overrides the visible label which is a minor anti-pattern but not a WCAG violation. Defer to code cleanup pass. |

---

## Test Coverage

| Test | Description | Status |
|------|-------------|--------|
| Empty state Level A | axe-core audit with no tasks | ✅ Pass |
| Active tasks Level A | axe-core audit after creating a task | ✅ Pass |
| Completed tasks Level A | axe-core audit after toggling a task | ✅ Pass |
| Error state Level A | axe-core audit with API failure banner | ✅ Pass |
| Level AA audit | Full AA audit with violation logging | ✅ Pass (0 violations) |
| Keyboard Tab order | All interactive elements are focusable | ✅ Pass |
| Keyboard create | Task created via Enter key | ✅ Pass |
| Keyboard toggle | Checkbox toggled via Space key | ✅ Pass |
| Focus visibility | Focus ring with sufficient contrast | ✅ Pass |
| Text alternatives | aria-label on icon-only controls | ✅ Pass |
| ARIA error region | Error banner with role="alert" | ✅ Pass |
| ARIA loading region | Loading indicator with role="status" | ✅ Pass |
| Semantic HTML | Heading hierarchy and landmark regions | ✅ Pass |

**Total accessibility tests:** 13
**Pass rate:** 100%

---

## Methodology

1. **Automated auditing:** `@axe-core/playwright` v4.11.2 injected via Playwright test runner
2. **Tag filtering:** Separate test suites for `wcag2a` (hard fail) and `wcag2aa` (documented stretch)
3. **Page states tested:** All user-facing states (empty, loaded with data, completed items, error)
4. **Manual verification:** Keyboard navigation, focus styles, ARIA attributes verified programmatically via Playwright assertions
5. **CI integration:** Tests run as part of `npm run test:e2e` and independently via `npm run test:a11y`
