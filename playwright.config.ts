import { defineConfig } from '@playwright/test'

export default defineConfig({
	webServer: {
		// Use console email provider for tests (avoids ZeptoMail rate limits)
		command:
			'pnpm db:reset && pnpm build && pnpm exec wrangler pages dev .svelte-kit/cloudflare -b EMAIL_PROVIDER=console',
		port: 8788,
		reuseExistingServer: !process.env.CI,
	},
	testDir: 'e2e',
})
