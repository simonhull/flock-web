import type { RequestHandler } from './$types'
import { createAuth } from '$lib/server/auth'
import { json } from '@sveltejs/kit'

/**
 * Test endpoint to verify auth is working.
 * Returns current session info if authenticated.
 *
 * DELETE THIS IN PRODUCTION or protect it.
 */
export const GET: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Database not available' }, { status: 500 })
	}

	const auth = createAuth(platform.env.DB, {
		baseURL: new URL(request.url).origin,
	})

	const session = await auth.api.getSession({
		headers: request.headers,
	})

	if (!session) {
		return json({
			authenticated: false,
			message: 'No active session',
		})
	}

	return json({
		authenticated: true,
		user: {
			id: session.user.id,
			email: session.user.email,
			emailVerified: session.user.emailVerified,
		},
		session: {
			id: session.session.id,
			expiresAt: session.session.expiresAt,
		},
	})
}
