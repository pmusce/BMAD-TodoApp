import { test, expect } from '@playwright/test'
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const REPORT_DIR = resolve(process.cwd(), '_bmad-output/test-artifacts')
const REPORT_JSON_PATH = join(REPORT_DIR, 'performance-report.json')

function appendInteractionTiming(operation: string, elapsedMs: number) {
  mkdirSync(REPORT_DIR, { recursive: true })
  let report: Record<string, unknown> = {}
  if (existsSync(REPORT_JSON_PATH)) {
    report = JSON.parse(readFileSync(REPORT_JSON_PATH, 'utf-8'))
  }
  if (!report.interactionTimings) {
    report.interactionTimings = {}
  }
  const timings = report.interactionTimings as Record<string, unknown>
  timings[operation] = { measured: elapsedMs, threshold: 300, unit: 'ms', pass: elapsedMs <= 300 }

  // Update NFR1 compliance
  if (!report.nfrCompliance) {
    report.nfrCompliance = {}
  }
  const nfr = report.nfrCompliance as Record<string, unknown>
  const allTimings = report.interactionTimings as Record<string, { measured: number; pass: boolean }>
  const allPass = Object.values(allTimings).every((t) => t.pass)
  const maxTime = Math.max(...Object.values(allTimings).map((t) => t.measured))
  nfr['NFR1-interaction-300ms'] = {
    threshold: 300,
    measured: maxTime,
    unit: 'ms',
    pass: allPass,
    note: 'Wall-clock time from user action to UI update (worst case shown)',
  }

  writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2))
}

test.describe('Lighthouse Performance Audit', () => {
  test('captures FCP, LCP, TBT, CLS, Performance Score, Speed Index', async () => {
    // Dynamic imports for CJS modules
    const lighthouse = (await import('lighthouse')).default
    const chromeLauncher = await import('chrome-launcher')

    // Launch a fresh Chrome instance with remote debugging
    const chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
    })

    try {
      // Run Lighthouse against the dev server
      const result = await lighthouse('http://localhost:5173', {
        port: chrome.port,
        output: 'json',
        onlyCategories: ['performance'],
        formFactor: 'desktop',
        screenEmulation: { disabled: true },
        throttling: {
          // Use no throttling for local dev baseline
          rttMs: 0,
          throughputKbps: 0,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      })

      expect(result).toBeTruthy()
      const lhr = result!.lhr

      // Extract key metrics
      const fcp = lhr.audits['first-contentful-paint']?.numericValue ?? null
      const lcp = lhr.audits['largest-contentful-paint']?.numericValue ?? null
      const tbt = lhr.audits['total-blocking-time']?.numericValue ?? null
      const cls = lhr.audits['cumulative-layout-shift']?.numericValue ?? null
      const si = lhr.audits['speed-index']?.numericValue ?? null
      const perfScore = lhr.categories['performance']?.score ?? null

      // Log metrics for visibility
      console.log('\n📊 Lighthouse Performance Metrics:')
      console.log(`  FCP: ${fcp !== null ? `${fcp.toFixed(0)}ms` : 'N/A'}`)
      console.log(`  LCP: ${lcp !== null ? `${lcp.toFixed(0)}ms` : 'N/A'}`)
      console.log(`  TBT: ${tbt !== null ? `${tbt.toFixed(0)}ms` : 'N/A'}`)
      console.log(`  CLS: ${cls !== null ? cls.toFixed(4) : 'N/A'}`)
      console.log(`  Speed Index: ${si !== null ? `${si.toFixed(0)}ms` : 'N/A'}`)
      console.log(`  Performance Score: ${perfScore !== null ? `${(perfScore * 100).toFixed(0)}/100` : 'N/A'}`)

      // Build report JSON
      const report = {
        timestamp: new Date().toISOString(),
        url: 'http://localhost:5173',
        environment: {
          formFactor: 'desktop',
          throttling: 'none (local baseline)',
          nodeVersion: process.version,
          lighthouseVersion: lhr.lighthouseVersion,
        },
        metrics: {
          firstContentfulPaint: { value: fcp, unit: 'ms' },
          largestContentfulPaint: { value: lcp, unit: 'ms' },
          totalBlockingTime: { value: tbt, unit: 'ms' },
          cumulativeLayoutShift: { value: cls, unit: 'score' },
          speedIndex: { value: si, unit: 'ms' },
          performanceScore: { value: perfScore !== null ? perfScore * 100 : null, unit: 'percent' },
        },
        nfrCompliance: {
          'NFR2-initial-load-1500ms': {
            threshold: 1500,
            measured: lcp,
            unit: 'ms',
            pass: lcp !== null && lcp <= 1500,
            note: 'LCP used as proxy for initial load completion (no throttling)',
          },
          'NFR4-cls-below-0.1': {
            threshold: 0.1,
            measured: cls,
            unit: 'score',
            pass: cls !== null && cls < 0.1,
          },
          'NFR5-no-main-thread-blocking': {
            threshold: 300,
            measured: tbt,
            unit: 'ms',
            pass: tbt !== null && tbt <= 300,
            note: 'TBT ≤ 300ms indicates no significant main thread blocking',
          },
        },
      }

      // Write report JSON
      mkdirSync(REPORT_DIR, { recursive: true })
      writeFileSync(REPORT_JSON_PATH, JSON.stringify(report, null, 2))

      // Assertions — verify metrics were captured (AC1)
      expect(fcp).not.toBeNull()
      expect(lcp).not.toBeNull()
      expect(tbt).not.toBeNull()
      expect(cls).not.toBeNull()
      expect(si).not.toBeNull()
      expect(perfScore).not.toBeNull()
    } finally {
      await chrome.kill()
    }
  })
})

test.describe('UI Interaction Timing (NFR1)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('create task completes within 300ms', async ({ page }) => {
    const taskText = `Perf test task ${Date.now()}`
    await page.fill('#task-input', taskText)

    const start = Date.now()
    await page.press('#task-input', 'Enter')
    await expect(
      page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
    ).toBeVisible()
    const elapsed = Date.now() - start

    console.log(`  Create task: ${elapsed}ms`)
    appendInteractionTiming('createTask', elapsed)
    expect(elapsed).toBeLessThanOrEqual(300)
  })

  test('toggle task completes within 300ms', async ({ page }) => {
    // Create a task first
    const taskText = `Toggle perf ${Date.now()}`
    await page.fill('#task-input', taskText)
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
    )
    await page.press('#task-input', 'Enter')
    await responsePromise

    await expect(
      page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
    ).toBeVisible()

    // Measure toggle time
    const start = Date.now()
    await page.getByRole('checkbox', { name: taskText }).click()
    await expect(
      page.getByRole('region', { name: 'Completed tasks' }).locator('.task-text--completed').filter({ hasText: taskText })
    ).toBeVisible()
    const elapsed = Date.now() - start

    console.log(`  Toggle task: ${elapsed}ms`)
    appendInteractionTiming('toggleTask', elapsed)
    expect(elapsed).toBeLessThanOrEqual(300)
  })

  test('delete task completes within 300ms', async ({ page }) => {
    // Create a task first
    const taskText = `Delete perf ${Date.now()}`
    await page.fill('#task-input', taskText)
    const responsePromise = page.waitForResponse(
      (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
    )
    await page.press('#task-input', 'Enter')
    await responsePromise

    await expect(
      page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
    ).toBeVisible()

    // Measure delete time
    const taskItem = page.locator('.task-item').filter({ hasText: taskText })
    const start = Date.now()
    await taskItem.getByRole('button', { name: 'Delete task' }).click()
    await expect(page.getByText(taskText)).not.toBeVisible()
    const elapsed = Date.now() - start

    console.log(`  Delete task: ${elapsed}ms`)
    appendInteractionTiming('deleteTask', elapsed)
    expect(elapsed).toBeLessThanOrEqual(300)
  })
})
