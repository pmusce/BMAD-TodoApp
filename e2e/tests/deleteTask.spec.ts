import { test, expect } from '../fixtures'

test('Delete a task → removed from list', async ({ page }) => {
  const taskText = `Test delete task ${Date.now()}`
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

  const taskItem = page.locator('.task-item').filter({ hasText: taskText })
  await taskItem.getByRole('button', { name: 'Delete task' }).click()

  await expect(page.getByText(taskText)).not.toBeVisible()
})
