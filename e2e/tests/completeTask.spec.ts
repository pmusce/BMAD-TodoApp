import { test, expect } from '../fixtures'

test('Toggle task → moves to completed group with strikethrough', async ({ page }) => {
  const taskText = `Test complete task ${Date.now()}`
  const responsePromise = page.waitForResponse(
    resp => resp.url().includes('/api/tasks') && resp.request().method() === 'POST'
  )
  await page.goto('/')
  await page.fill('#task-input', taskText)
  await page.press('#task-input', 'Enter')
  await responsePromise // wait for optimistic ID to be replaced with real server ID

  await expect(
    page.getByRole('region', { name: 'Active tasks' }).getByText(taskText)
  ).toBeVisible()

  await page.getByRole('checkbox', { name: taskText }).click()

  const completedSection = page.getByRole('region', { name: 'Completed tasks' })
  await expect(completedSection).toContainText(taskText)
  await expect(
    completedSection.locator('.task-text--completed').filter({ hasText: taskText })
  ).toBeVisible()
})
