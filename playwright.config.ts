import { defineConfig } from '@playwright/test'

export default defineConfig({
	webServer: {
		// Use console email provider for tests (avoids ZeptoMail rate limits)
		// Note: Run `pnpm db:reset && pnpm build` before running tests
		command: 'pnpm exec wrangler pages dev .svelte-kit/cloudflare -b EMAIL_PROVIDER=console',
		port: 8788,
		reuseExistingServer: !process.env.CI,
		timeout: 30000,
	},
	testDir: 'e2e',
})
