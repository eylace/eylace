import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Admin Orders table layout regression.
 *
 * Runs against the local Vite dev server. Three projects exercise the
 * same specs at desktop / tablet / mobile widths so column-spacing
 * regressions are caught at every responsive breakpoint.
 *
 * Visual snapshots live next to the spec under `e2e/__screenshots__/`.
 * Update them intentionally with: `npx playwright test --update-snapshots`.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: {
    // 0.2% pixel tolerance — covers font antialiasing without hiding real shifts.
    toHaveScreenshot: { maxDiffPixelRatio: 0.002 },
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:8080',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:8080',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'tablet',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } },
    },
    {
      name: 'mobile',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } },
    },
  ],
});