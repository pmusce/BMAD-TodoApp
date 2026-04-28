# Performance Testing Report

**Date:** 2026-04-28  
**Environment:**
- Node.js: v24.11.0
- Browser: Chromium (Playwright Desktop Chrome)
- Lighthouse: v13.1.0
- Mode: Local development (Vite dev server, no network throttling)
- Form factor: Desktop

---

## Lighthouse Performance Metrics

| Metric | Value | Rating |
|--------|-------|--------|
| **Performance Score** | 100/100 | Excellent |
| First Contentful Paint (FCP) | 6ms | Excellent |
| Largest Contentful Paint (LCP) | 10ms | Excellent |
| Total Blocking Time (TBT) | 0ms | Excellent |
| Cumulative Layout Shift (CLS) | 0.0088 | Excellent |
| Speed Index (SI) | 304ms | Excellent |

**Note:** Metrics captured with no throttling (local baseline). Real-world performance on slower connections will differ. These values establish the development baseline for regression detection.

---

## NFR Compliance Matrix

| NFR | Requirement | Threshold | Measured | Status |
|-----|-------------|-----------|----------|--------|
| **NFR1** | UI interactions complete within 300ms | ≤ 300ms | 60ms (worst case: toggle) | **PASS** |
| **NFR2** | Initial load within 1.5s | ≤ 1500ms | 10ms LCP (no throttling) | **PASS** |
| **NFR4** | CLS below 0.1 | < 0.1 | 0.0088 | **PASS** |
| **NFR5** | No main thread blocking | TBT ≤ 300ms | 0ms | **PASS** |

### NFR1: UI Interaction Timing (300ms threshold)

| Operation | Measured | Threshold | Status |
|-----------|----------|-----------|--------|
| Create task | 16ms | 300ms | **PASS** |
| Toggle task | 60ms | 300ms | **PASS** |
| Delete task | 18ms | 300ms | **PASS** |

All UI interactions complete well within the 300ms threshold. Toggle task is slightly slower due to optimistic UI → server round-trip → completed section rendering, but still far within limits.

### NFR2: Initial Load Time (1.5s threshold)

- **LCP (no throttling):** 10ms — well within 1.5s threshold
- **Interpretation:** With no network throttling, LCP reflects local rendering speed. On a standard broadband connection (~25 Mbps), the Vite-bundled SPA (~200KB gzipped) should load within 200-400ms including network time, still well under 1.5s.
- **Lighthouse Speed Index:** 304ms — confirms fast visual progression

### NFR4: Cumulative Layout Shift (< 0.1 threshold)

- **CLS:** 0.0088 — excellent, far below the 0.1 threshold
- The application layout is stable during load with no significant shifts

### NFR5: Main Thread Blocking (informational)

- **TBT:** 0ms — no main thread blocking detected
- The application does not perform CPU-intensive work during load

---

## Issues Found

**No issues identified.** All NFR thresholds pass with comfortable margins.

---

## Deferred Work Context (Performance-Related)

From `deferred-work.md`:
- **gzip/brotli compression missing from nginx config** — affects production Docker deployment; tested against dev server baseline (Vite already serves gzipped in development)
- **nginx missing security headers** — no performance impact; may reduce Lighthouse Best Practices score in Docker context

---

## Baseline Establishment

These metrics establish the **development environment performance baseline** for the Todo App:

| Metric | Baseline Value | Use For |
|--------|---------------|---------|
| Performance Score | 100 | Regression detection |
| FCP | < 10ms | Page render speed |
| LCP | < 15ms | Content visibility |
| TBT | 0ms | Main thread health |
| CLS | < 0.01 | Layout stability |
| Create interaction | < 20ms | CRUD performance |
| Toggle interaction | < 70ms | CRUD performance |
| Delete interaction | < 20ms | CRUD performance |

**Recommendation:** Re-run `npm run test:perf` after significant frontend changes (new components, state management changes, dependency upgrades) to detect regressions against this baseline.

---

## How to Run

```bash
# Run performance tests (starts dev servers automatically)
npm run test:perf

# View HTML report
npx playwright show-report playwright-report-perf
```

**Machine-readable results:** `_bmad-output/test-artifacts/performance-report.json`
