import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_PATH = '/ITpassportApp/'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'on-first-retry',
  },
  projects: [
    // iPhone の Safari に最も近い構成（CI で実行）
    {
      name: 'iphone-webkit',
      use: { ...devices['iPhone 15'] },
    },
    // WebKit が入っていない環境向け。iPhone の画面サイズ・タッチ操作を Chromium で再現する
    {
      name: 'iphone-chromium',
      use: {
        ...devices['iPhone 15'],
        browserName: 'chromium',
        defaultBrowserType: 'chromium',
      },
    },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
