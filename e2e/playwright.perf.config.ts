import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/performance*.spec.ts',
  timeout: 120_000,
  reporter: [['html', { outputFolder: '../playwright-report-perf' }], ['list']],
  forbidOnly: !!process.env.CI,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'off',
  },
  projects: [
    {
      name: 'performance',
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
      url: 'http://localhost:3000/api/tasks',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
