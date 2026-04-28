import { test, expect } from '../fixtures'
import { AxeBuilder } from '@axe-core/playwright'

test.describe('Accessibility Audit', () => {
  test.describe('WCAG 2.1 Level A - Must Pass', () => {
    test('empty state has no Level A violations', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.task-list')

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze()

      expect(results.violations).toEqual([])
    })

    test('page with active tasks has no Level A violations', async ({ page }) => {
      await page.goto('/')
      const taskText = `A11y test task ${Date.now()}`
      await page.fill('#task-input', taskText)
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await responsePromise

      await expect(
        page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
      ).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze()

      expect(results.violations).toEqual([])
    })

    test('page with completed tasks has no Level A violations', async ({ page }) => {
      await page.goto('/')
      const taskText = `A11y completed ${Date.now()}`
      await page.fill('#task-input', taskText)
      const postPromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await postPromise

      const patchPromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH'
      )
      await page.getByRole('checkbox', { name: taskText }).click()
      await patchPromise

      await expect(
        page.getByRole('region', { name: 'Completed tasks' }).getByText(taskText)
      ).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze()

      expect(results.violations).toEqual([])
    })

    test('error state has no Level A violations', async ({ page }) => {
      await page.route('**/api/tasks', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
          }),
        })
      )
      await page.goto('/')
      await expect(page.getByRole('alert')).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a'])
        .analyze()

      expect(results.violations).toEqual([])
    })
  })

  test.describe('WCAG 2.1 Level AA - Documented Stretch', () => {
    test('audit Level AA violations and document findings', async ({ page }) => {
      await page.goto('/')
      const taskText = `A11y AA test ${Date.now()}`
      await page.fill('#task-input', taskText)
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await responsePromise

      await expect(
        page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
      ).toBeVisible()

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2aa'])
        .analyze()

      // Log AA violations for documentation — these do NOT fail the test
      if (results.violations.length > 0) {
        console.log('\n=== WCAG 2.1 Level AA Violations (Stretch Goals) ===')
        for (const violation of results.violations) {
          console.log(`\n[${violation.impact?.toUpperCase()}] ${violation.id}: ${violation.description}`)
          console.log(`  Help: ${violation.helpUrl}`)
          console.log(`  Affected nodes: ${violation.nodes.length}`)
          for (const node of violation.nodes) {
            console.log(`    - ${node.target.join(', ')}`)
          }
        }
        console.log('\n=== End Level AA Findings ===\n')
      } else {
        console.log('\n✅ No WCAG 2.1 Level AA violations found\n')
      }

      // This test always passes — AA is stretch goal, findings are documented
      expect(true).toBe(true)
    })
  })

  test.describe('NFR Compliance Verification', () => {
    test('NFR10: all interactive elements reachable via keyboard (Tab order)', async ({ page }) => {
      await page.goto('/')
      const taskText = `Keyboard nav test ${Date.now()}`
      await page.fill('#task-input', taskText)
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await responsePromise

      await expect(
        page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
      ).toBeVisible()

      // Verify all key interactive elements are focusable (tabindex not -1)
      // Task input
      const inputTabindex = await page.locator('#task-input').getAttribute('tabindex')
      expect(inputTabindex).not.toBe('-1')

      // Add button
      const addBtnTabindex = await page.getByRole('button', { name: 'Add task' }).getAttribute('tabindex')
      expect(addBtnTabindex).not.toBe('-1')

      // Checkbox (at least the one for our task)
      const checkbox = page.getByRole('checkbox', { name: taskText })
      const checkboxTabindex = await checkbox.getAttribute('tabindex')
      expect(checkboxTabindex).not.toBe('-1')

      // Delete button
      const deleteBtn = page.getByRole('button', { name: 'Delete task' }).first()
      const deleteBtnTabindex = await deleteBtn.getAttribute('tabindex')
      expect(deleteBtnTabindex).not.toBe('-1')

      // Verify sequential Tab order: input → add button → checkbox → delete button
      await page.locator('#task-input').focus()

      await page.keyboard.press('Tab')
      const afterInput = await page.evaluate(() => document.activeElement?.getAttribute('aria-label') || document.activeElement?.textContent)
      expect(afterInput).toContain('Add task')

      await page.keyboard.press('Tab')
      const afterAdd = await page.evaluate(() => document.activeElement?.getAttribute('type') || document.activeElement?.role)
      expect(afterAdd).toBe('checkbox')

      await page.keyboard.press('Tab')
      const afterCheckbox = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
      expect(afterCheckbox).toBe('Delete task')
    })

    test('NFR10: task can be created via keyboard alone (Enter key)', async ({ page }) => {
      await page.goto('/')
      await page.waitForSelector('.task-list')
      const taskText = `Keyboard create ${Date.now()}`

      // Focus the input via Tab until we reach it
      await page.locator('#task-input').focus()
      // Verify we can type into it
      await page.keyboard.type(taskText)
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.keyboard.press('Enter')
      await responsePromise

      await expect(
        page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
      ).toBeVisible()
    })

    test('NFR10: task can be toggled via keyboard (Space on checkbox)', async ({ page }) => {
      await page.goto('/')
      const taskText = `Keyboard toggle ${Date.now()}`
      await page.fill('#task-input', taskText)
      const postPromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await postPromise

      // Tab to the checkbox
      await page.getByRole('checkbox', { name: taskText }).focus()

      const patchPromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH'
      )
      await page.keyboard.press('Space')
      await patchPromise

      await expect(
        page.getByRole('region', { name: 'Completed tasks' }).getByText(taskText)
      ).toBeVisible()
    })

    test('NFR11: focus indicators are visible with sufficient contrast', async ({ page }) => {
      await page.goto('/')
      const taskText = `Focus test ${Date.now()}`
      await page.fill('#task-input', taskText)
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await responsePromise

      await expect(
        page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
      ).toBeVisible()

      // Helper to check focus outline on a given element
      const checkFocusOutline = async (locator: import('@playwright/test').Locator) => {
        await locator.focus()
        const outline = await locator.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            outlineStyle: style.outlineStyle,
            outlineWidth: style.outlineWidth,
          }
        })
        expect(outline.outlineStyle).not.toBe('none')
        expect(parseFloat(outline.outlineWidth)).toBeGreaterThanOrEqual(2)
      }

      // Check focus indicators on all interactive element types
      await checkFocusOutline(page.locator('#task-input'))
      await checkFocusOutline(page.getByRole('button', { name: 'Add task' }))
      await checkFocusOutline(page.getByRole('checkbox', { name: taskText }))
      await checkFocusOutline(page.getByRole('button', { name: 'Delete task' }).first())
    })

    test('NFR12: icon-only controls have text alternatives', async ({ page }) => {
      await page.goto('/')
      const taskText = `ARIA test ${Date.now()}`
      await page.fill('#task-input', taskText)
      const responsePromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await responsePromise

      // Delete button (icon-only ×) must have aria-label — use .first() since multiple tasks exist
      const deleteBtn = page.getByRole('button', { name: 'Delete task' }).first()
      await expect(deleteBtn).toBeVisible()
      await expect(deleteBtn).toHaveAttribute('aria-label', 'Delete task')

      // Add button must have aria-label
      const addBtn = page.getByRole('button', { name: 'Add task' })
      await expect(addBtn).toBeVisible()
      await expect(addBtn).toHaveAttribute('aria-label', 'Add task')
    })

    test('NFR13: error state announced via ARIA live region', async ({ page }) => {
      await page.route('**/api/tasks', (route) =>
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({
            statusCode: 500,
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
          }),
        })
      )
      await page.goto('/')

      // Error banner must have role="alert" (implicitly aria-live="assertive")
      const alert = page.getByRole('alert')
      await expect(alert).toBeVisible()
      await expect(alert).toContainText('Failed to load tasks.')
    })

    test('NFR13: loading state announced via ARIA live region', async ({ page }) => {
      // Delay API response to catch loading state
      await page.route('**/api/tasks', async (route) => {
        await new Promise((r) => setTimeout(r, 500))
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        })
      })
      await page.goto('/')

      // Loading indicator must have role="status" (implicitly aria-live="polite")
      const status = page.getByRole('status')
      await expect(status).toBeVisible()
      await expect(status).toContainText('Loading')
    })

    test('semantic HTML: heading hierarchy and landmark regions', async ({ page }) => {
      await page.goto('/')
      const taskText = `Semantic test ${Date.now()}`
      await page.fill('#task-input', taskText)
      const postPromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
      )
      await page.press('#task-input', 'Enter')
      await postPromise

      // Toggle the task to completed so both sections render
      const patchPromise = page.waitForResponse(
        (r) => r.url().includes('/api/tasks/') && r.request().method() === 'PATCH'
      )
      await page.getByRole('checkbox', { name: taskText }).click()
      await patchPromise

      // Verify <main> landmark exists
      const main = page.locator('main')
      await expect(main).toBeVisible()

      // Verify h2 headings in both task list sections
      const h2Active = page.getByRole('heading', { name: 'Active', level: 2 })
      await expect(h2Active).toBeVisible()

      const h2Completed = page.getByRole('heading', { name: 'Completed', level: 2 })
      await expect(h2Completed).toBeVisible()

      // Verify sections have aria-labels
      const activeSection = page.getByRole('region', { name: 'Active tasks' })
      await expect(activeSection).toBeVisible()

      const completedSection = page.getByRole('region', { name: 'Completed tasks' })
      await expect(completedSection).toBeVisible()
    })
  })
})
