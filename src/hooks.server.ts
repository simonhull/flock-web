import { redirect, type Handle } from '@sveltejs/kit'

import { createEmailService } from '$lib/server/email'
import { createAuthService } from '$lib/server/services/auth.service'

// Routes that don't require authentication
const publicRoutes = ['/login', '/register', '/verify-email', '/api/auth', '/api/health']

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

	// Create email service from environment
	const emailService = createEmailService({
		provider: (platform.env.EMAIL_PROVIDER as 'console' | 'zepto') ?? 'console',
		zepto: {
			token: platform.env.ZEPTO_MAIL_TOKEN ?? '',
			from: platform.env.ZEPTO_MAIL_FROM ?? 'noreply@myflock.app',
			fromName: platform.env.ZEPTO_MAIL_FROM_NAME ?? 'Flock',
		},
	})

	// Create auth service for session checking
	const authService = createAuthService(platform.env.DB, url.origin, emailService)

	// For auth pages, check if user is already authenticated
	const isAuthPage = url.pathname === '/login' || url.pathname === '/register'
	if (isAuthPage) {
		const user = await authService.getSession(event.request.headers)
		if (user) {
			// Authenticated but unverified -> send to verify-email
			if (!user.emailVerified) {
				redirect(303, '/verify-email')
			}
			// Authenticated and verified -> send to dashboard
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

	// Redirect unverified users to verify-email (except for verify-email page itself)
	if (!user.emailVerified && url.pathname !== '/verify-email') {
		redirect(303, '/verify-email')
	}

	// If authenticated user hits home page, send to dashboard
	if (url.pathname === '/') {
		redirect(303, '/dashboard')
	}

	return resolve(event)
}
