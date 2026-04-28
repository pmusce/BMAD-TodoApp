import { test, expect } from '../fixtures'

test('API failure → inline error state displayed', async ({ page }) => {
  await page.route('**/api/tasks', route =>
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
  await expect(page.getByRole('alert')).toContainText('Failed to load tasks.')
})
