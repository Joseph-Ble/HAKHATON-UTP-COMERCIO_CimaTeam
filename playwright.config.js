import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90000,
  workers: 1,
  use: {
    baseURL: process.env.VECINOS_TEST_BASE_URL || "http://localhost:8081",
    viewport: { width: 1280, height: 950 },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox", "--disable-dev-shm-usage"],
    },
  },
  reporter: [
    ["list"],
    [
      "json",
      {
        outputFile:
          process.env.VECINOS_TEST_REPORT ||
          "artifacts/playwright-results.json",
      },
    ],
  ],
  outputDir: process.env.VECINOS_TEST_OUTPUT || "artifacts/browser-tests",
});
