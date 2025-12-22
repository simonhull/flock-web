import { redirect, type Handle } from '@sveltejs/kit'

import { createAuthService } from '$lib/server/services/auth.service'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/api/auth', '/api/health']

// Check if a path is public
function isPublicRoute(path: string): boolean {
	return publicRoutes.some(route => path === route || path.startsWith(`${route}/`))
}

export const handle: Handle = async ({ event, resolve }) => {
	const { url, platform } = event

	// Initialize locals
	event.locals.user = null
	event.locals.session = null

	// If no database, allow request (will fail gracefully in route)
	if (!platform?.env?.DB) {
		return resolve(event)
	}

	// Create auth service for session checking
	const authService = createAuthService(platform.env.DB, url.origin)

	// For auth pages, check if user is already authenticated and redirect to dashboard
	const isAuthPage = url.pathname === '/login' || url.pathname === '/register'
	if (isAuthPage) {
		const user = await authService.getSession(event.request.headers)
		if (user) {
			redirect(303, '/dashboard')
		}
		// Not authenticated, allow access to auth page
		return resolve(event)
	}

	// Skip auth check for other public routes
	if (isPublicRoute(url.pathname)) {
		return resolve(event)
	}

	// For protected routes, check authentication
	const user = await authService.getSession(event.request.headers)

	// Store user in locals for use in routes
	event.locals.user = user

	// Redirect unauthenticated users to login
	if (!user) {
		// For the home page, redirect to login
		// For other protected routes, redirect to login with a return URL
		if (url.pathname === '/') {
			redirect(303, '/login')
		}
		const redirectTo = encodeURIComponent(url.pathname + url.search)
		redirect(303, `/login?redirectTo=${redirectTo}`)
	}

	// If authenticated user hits home page, send to dashboard
	if (url.pathname === '/') {
		redirect(303, '/dashboard')
	}

	return resolve(event)
}
