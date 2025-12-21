import type { Actions } from './$types'
import { createAuth } from '$lib/server/auth'
import { RegisterSchema } from '$lib/utils/validation/auth'
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
		const confirmPassword = formData.get('confirmPassword')

		// Validate input
		const result = v.safeParse(RegisterSchema, {
			email,
			password,
			confirmPassword,
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

		// Create auth instance and sign up
		const auth = createAuth(platform.env.DB, {
			baseURL: new URL(request.url).origin,
		})

		try {
			const response = await auth.api.signUpEmail({
				body: {
					email: result.output.email,
					password: result.output.password,
					name: result.output.email.split('@').at(0) ?? 'User',
				},
				headers: request.headers,
			})

			if (!response.user) {
				return fail(400, {
					error: 'Registration failed. Please try again.',
					email: result.output.email,
				})
			}
		}
		catch (err) {
			const message = err instanceof Error ? err.message : 'Registration failed'
			// Check for duplicate email
			if (message.includes('UNIQUE constraint') || message.includes('already exists')) {
				return fail(400, {
					error: 'An account with this email already exists.',
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
