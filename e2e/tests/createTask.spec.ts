import { test, expect } from '../fixtures'

test('Create a task → appears in active list', async ({ page }) => {
  const taskText = `Test create task ${Date.now()}`
  await page.goto('/')
  await page.fill('#task-input', taskText)
  const responsePromise = page.waitForResponse(
    (r) => r.url().includes('/api/tasks') && r.request().method() === 'POST'
  )
  await page.press('#task-input', 'Enter')
  await responsePromise
  await expect(
    page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
  ).toBeVisible()
})
