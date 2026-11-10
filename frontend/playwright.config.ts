import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const root = process.cwd();

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "python -m uvicorn app.main:app --host 127.0.0.1 --port 8000",
      url: "http://127.0.0.1:8000/health",
      cwd: path.resolve(root, ".."),
      timeout: 60_000,
      reuseExistingServer: !process.env.CI,
      env: { PYTHONUTF8: "1" },
    },
    {
      command: "npm run dev -- --hostname 127.0.0.1 --port 3000",
      url: "http://127.0.0.1:3000",
      cwd: root,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: { NEXT_TELEMETRY_DISABLED: "1" },
    },
  ],
});
