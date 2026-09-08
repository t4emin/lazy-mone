import "dotenv/config";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  projects: [
    { name: "flows", testIgnore: /rate-limit\.spec\.ts/ },
    {
      name: "rate-limit",
      testMatch: /rate-limit\.spec\.ts/,
      dependencies: ["flows"],
    },
  ],
  use: {
    baseURL: process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000",
    channel: "chrome",
    viewport: { width: 1366, height: 900 },
    screenshot: "only-on-failure",
    trace: "off",
  },
});
