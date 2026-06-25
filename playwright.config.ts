import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * Playwright Test Configuration for Tactical RMM Web
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Test patterns to match */
  testMatch: "**/*.spec.ts",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 1,

  /* Parallel workers configuration */
  workers: process.env.CI ? 1 : 4,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/results.xml" }],
  ],

  /* Global test timeout - increased for component interactions */
  timeout: 60 * 1000,

  /* Expect timeout */
  expect: {
    timeout: 10 * 1000,
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:9000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Record video on failure */
    video: "retain-on-failure",

    /* Global navigation timeout */
    navigationTimeout: 30 * 1000,

    /* Global action timeout */
    actionTimeout: 15 * 1000,

    /* Viewport size for consistent testing */
    viewport: { width: 1280, height: 720 },

    /* Ignore HTTPS errors (useful for dev environment) */
    ignoreHTTPSErrors: true,

    /* Locale for date/time formatting */
    locale: "en-US",

    /* Timezone for consistent date handling */
    timezoneId: "America/New_York",
  },

  /* Configure projects for major browsers */
  projects: [
    /* Setup project - handles authentication state */
    {
      name: "setup",
      testMatch: /global.setup\.ts/,
    },

    /* Main Chromium tests */
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },

    /* Firefox tests (optional) */
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      dependencies: ["setup"],
    },

    /* Safari tests (optional) */
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      dependencies: ["setup"],
    },

    /* Mobile Chrome tests */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
    },

    /* Mobile Safari tests */
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
      dependencies: ["setup"],
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:9000",
    reuseExistingServer: true,
    timeout: 180 * 1000,
    stdout: "pipe",
    stderr: "pipe",
  },

  /* Output folder for test artifacts */
  outputDir: "test-results/artifacts",
});
