import { createAuthClient } from 'better-auth/svelte'

export const auth = createAuthClient({
	baseURL: import.meta.env.DEV
		? 'http://localhost:5173'
		: 'https://flock.church',
})
