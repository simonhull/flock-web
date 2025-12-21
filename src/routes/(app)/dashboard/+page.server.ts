import type { Actions } from './$types'
import { createAuth } from '$lib/server/auth'
import { redirect } from '@sveltejs/kit'

export const actions = {
	logout: async ({ request, platform }) => {
		if (!platform?.env?.DB) {
			redirect(303, '/login')
		}

		const auth = createAuth(platform.env.DB, {
			baseURL: new URL(request.url).origin,
		})

		try {
			await auth.api.signOut({
				headers: request.headers,
			})
		}
		catch {
			// Ignore errors, redirect to login anyway
		}

		redirect(303, '/login')
	},
} satisfies Actions
