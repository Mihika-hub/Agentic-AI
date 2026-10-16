import { defineConfig, devices } from '@playwright/test'

// Browser tests run against their own API (port 3101) with a throwaway in-memory
// database, and their own Vite server (port 5174). Your real data is never touched.
const API_PORT = 3101
const WEB_PORT = 5174
const testEnv = {
  API_PORT: String(API_PORT),
  PULSEFIT_DB_PATH: 'memory://pulsefit-e2e',
  DATABASE_URL: '',
  JWT_SECRET: 'e2e-only-secret-that-is-long-enough-for-hs256-signing',
}

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'playwright-report/e2e-results.json' }]],
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop-chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    // iPhone 13 screen size, touch and user agent, rendered by Chrome.
    { name: 'mobile-iphone', use: { ...devices['iPhone 13'], browserName: 'chromium', channel: 'chrome' } },
  ],
  webServer: [
    {
      command: 'node server/dev-server.js',
      url: `http://localhost:${API_PORT}/api/stats`,
      env: testEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: testEnv,
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
