import type { Handle } from '@sveltejs/kit'
import { redirect } from '@sveltejs/kit'
import { createAuth } from '$lib/server/auth'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth', '/api/health']

// Check if a path is public
function isPublicRoute(path: string): boolean {
	return publicRoutes.some(route => path === route || path.startsWith(`${route}/`))
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url, platform } = event

	// Skip auth check for public routes
	if (isPublicRoute(url.pathname)) {
		return resolve(event)
	}

	// If no database, allow request (will fail gracefully in route)
	if (!platform?.env?.DB) {
		return resolve(event)
	}

	// Check authentication
	const auth = createAuth(platform.env.DB, {
		baseURL: url.origin,
	})

	const session = await auth.api.getSession({
		headers: event.request.headers,
	})

	// Store user in locals for use in routes
	event.locals.user = session?.user ?? null
	event.locals.session = session?.session ?? null

	// Redirect unauthenticated users to login
	if (!session?.user) {
		// For the home page, redirect to login
		// For other protected routes, redirect to login with a return URL
		if (url.pathname === '/') {
			redirect(303, '/login')
		}
		redirect(303, `/login?redirectTo=${encodeURIComponent(url.pathname)}`)
	}

	// If authenticated user hits home page, send to dashboard
	if (url.pathname === '/') {
		redirect(303, '/dashboard')
	}

	return resolve(event)
}
