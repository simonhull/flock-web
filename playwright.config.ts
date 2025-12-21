import { defineConfig } from '@playwright/test'

export default defineConfig({
	webServer: {
		command: 'pnpm db:reset && pnpm build && pnpm preview',
		port: 8788,
		reuseExistingServer: !process.env.CI,
	},
	testDir: 'e2e',
})
