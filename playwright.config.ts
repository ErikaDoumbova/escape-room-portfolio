import { defineConfig } from '@playwright/test';

// Tests run against the production build in dist/, served by scripts/serve-dist.mjs,
// which behaves like GitHub Pages (folder index.html, 404.html fallback, base path).
const PORT = 4173;
const BASE_PATH = process.env.BASE_PATH ?? '/';
// CI uses Playwright's bundled Chromium. Locally you can point at an installed
// browser instead, e.g. PW_CHANNEL=chrome npm run test:e2e
const channel = process.env.PW_CHANNEL || undefined;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'desktop',
      use: { browserName: 'chromium', channel, viewport: { width: 1440, height: 900 } },
    },
    {
      name: 'mobile',
      use: {
        browserName: 'chromium',
        channel,
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: `node scripts/serve-dist.mjs --port ${PORT}`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !process.env.CI,
  },
});
