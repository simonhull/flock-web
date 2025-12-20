import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	compilerOptions: {
		experimental: {
			async: true,
		},
	},

	kit: {
		adapter: adapter({
			platformProxy: {
				configPath: 'wrangler.toml',
			},
		}),
		experimental: {
			remoteFunctions: true,
		},
	},
}

export default config
