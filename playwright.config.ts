import { defineConfig, devices } from "@playwright/test";

/**
 * End-to-end tests run against a production build with an isolated database, file store and build directory,
 * reseeded with the demonstration data set on every run (port 3200, so a normal dev server is untouched).
 */
const PORT = 3200;
const env = {
  DATABASE_URL: "file:./data/e2e.db",
  STORAGE_DIR: "./storage-e2e",
  APP_URL: `http://localhost:${PORT}`,
  NEXT_DIST_DIR: ".next-e2e",
  DEMO_MODE: "1",
  // The local file store is development-only; allow it for this isolated test server.
  ALLOW_LOCAL_STORAGE: "1",
  RESEND_API_KEY: "",
  SECRETARIAT_EMAIL: "secretariat@accphe.test",
  // As on Vercel (POSIX syntax that Intl rejects): portal times must not depend on TZ.
  TZ: ":UTC",
};

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"],
    viewport: { width: 1360, height: 900 },
    // Uses the installed Google Chrome when PW_CHANNEL=chrome (no browser download needed); otherwise Playwright's Chromium.
    ...(process.env.PW_CHANNEL ? { channel: process.env.PW_CHANNEL } : {}),
  },
  webServer: {
    // A production build: deterministic (no on-demand compilation or reloads during tests).
    command: `rm -rf data/e2e.db* storage-e2e && npm run db:push && npm run db:seed && npx next build && npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}/robots.txt`,
    timeout: 600_000,
    reuseExistingServer: false,
    env,
    stdout: "ignore",
    stderr: "pipe",
  },
});
