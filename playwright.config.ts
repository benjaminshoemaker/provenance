import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const authStateDir = path.join(process.cwd(), ".claude", "verification");
const e2eAuthSecret = process.env.E2E_AUTH_SECRET ?? "local-e2e-secret";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  reporter: [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: `cd ${process.cwd()} && npm run dev:e2e`,
    cwd: process.cwd(),
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      E2E_AUTH_ENABLED: "true",
      E2E_AUTH_SECRET: e2eAuthSecret,
    },
  },
  projects: [
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(authStateDir, "auth-state-author-a.json"),
      },
      dependencies: ["setup"],
    },
  ],
});
