import type { Actions } from './$types'
import { createAuth } from '$lib/server/auth'
import { LoginSchema } from '$lib/utils/validation/auth'
import { fail, redirect } from '@sveltejs/kit'
import * as v from 'valibot'

export const actions = {
	default: async ({ request, platform }) => {
		if (!platform?.env?.DB) {
			return fail(500, { error: 'Database not available' })
		}

		const formData = await request.formData()
		const email = formData.get('email')
		const password = formData.get('password')

		// Validate input
		const result = v.safeParse(LoginSchema, {
			email,
			password,
		})

		if (!result.success) {
			const errors: Record<string, string> = {}
			for (const issue of result.issues) {
				const path = issue.path?.[0]?.key
				if (path && typeof path === 'string') {
					errors[path] = issue.message
				}
			}
			return fail(400, {
				errors,
				email: typeof email === 'string' ? email : '',
			})
		}

		// Create auth instance and sign in
		const auth = createAuth(platform.env.DB, {
			baseURL: new URL(request.url).origin,
		})

		try {
			const response = await auth.api.signInEmail({
				body: {
					email: result.output.email,
					password: result.output.password,
				},
				headers: request.headers,
			})

			if (!response.user) {
				return fail(400, {
					error: 'Invalid email or password.',
					email: result.output.email,
				})
			}
		}
		catch (err) {
			const message = err instanceof Error ? err.message : 'Sign in failed'
			// Handle invalid credentials
			if (message.includes('Invalid') || message.includes('password')) {
				return fail(400, {
					error: 'Invalid email or password.',
					email: result.output.email,
				})
			}
			return fail(400, {
				error: message,
				email: result.output.email,
			})
		}

		redirect(303, '/dashboard')
	},
} satisfies Actions
