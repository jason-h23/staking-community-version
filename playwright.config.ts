import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./e2e",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: "list",
	use: {
		baseURL: "http://localhost:3001",
		trace: "on-first-retry",
		headless: true,
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: {
		command: "npm run dev -- -p 3001",
		url: "http://localhost:3001",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000,
	},
	timeout: 30 * 1000,
	expect: {
		timeout: 10 * 1000,
	},
});
