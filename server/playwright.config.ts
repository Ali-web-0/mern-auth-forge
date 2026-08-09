import { defineConfig, devices } from '@playwright/test'

// E2E runs against the REAL dev stack — server + client + a real MongoDB
// (see server/.env, MONGODB_URI). This is deliberately different from the
// integration tier, which uses mongodb-memory-server: E2E is meant to
// catch issues that only show up when the browser, both dev servers, and
// cookie-based auth are all wired together for real.
//
// Prerequisite: MongoDB must be running locally (or MONGODB_URI must point
// at a reachable instance) before `npm run test:e2e`.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run dev',
      cwd: '.',
      url: 'http://localhost:4000/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 20_000,
    },
    {
      command: 'npm run dev',
      cwd: '../client',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 20_000,
    },
  ],
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
