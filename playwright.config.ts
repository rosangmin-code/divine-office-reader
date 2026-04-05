import { defineConfig } from "@playwright/test"

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: "http://localhost:3300",
    headless: true,
  },
  webServer: {
    command: "npm run dev -- --port 3300",
    port: 3300,
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    { name: "desktop", use: { viewport: { width: 1280, height: 720 } } },
    { name: "mobile", use: { viewport: { width: 375, height: 812 } } },
  ],
})
