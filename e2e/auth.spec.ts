import { expect, test } from '@playwright/test'

/**
 * Helper to parse set-cookie header and extract cookie name=value pairs
 */
function parseCookies(setCookieHeader: string | undefined): string {
	if (!setCookieHeader) return ''
	// set-cookie can have multiple cookies separated by newlines or be an array
	// Each cookie is: name=value; path=/; ...
	// We only need the name=value part
	return setCookieHeader
		.split(/[\n,]/)
		.map(cookie => cookie.split(';')[0]?.trim())
		.filter(Boolean)
		.join('; ')
}

// Base URL for Origin header (CSRF protection)
const ORIGIN = 'http://localhost:8788'

test.describe('Authentication API', () => {
	const testPassword = 'SecurePass123'

	test('can sign up a new user', async ({ request }) => {
		const email = `signup-${Date.now()}@example.com`

		const response = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: {
				email,
				password: testPassword,
				name: 'Test User',
			},
		})

		expect(response.ok()).toBe(true)

		const body = await response.json()
		expect(body.user).toBeDefined()
		expect(body.user.email).toBe(email)
	})

	test('cannot sign up with same email twice', async ({ request }) => {
		const email = `duplicate-${Date.now()}@example.com`

		// First signup should succeed
		const first = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: {
				email,
				password: testPassword,
				name: 'First User',
			},
		})
		expect(first.ok()).toBe(true)

		// Second signup with same email should fail
		const second = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: {
				email,
				password: testPassword,
				name: 'Second User',
			},
		})
		expect(second.ok()).toBe(false)
	})

	test('can sign in with correct credentials', async ({ request }) => {
		const email = `signin-${Date.now()}@example.com`

		// Create user first
		const signupResponse = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword, name: 'Sign In Test' },
		})
		expect(signupResponse.ok()).toBe(true)

		// Sign in (even if already signed in from signup - should work)
		const response = await request.post('/api/auth/sign-in/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword },
		})

		expect(response.ok()).toBe(true)

		const body = await response.json()
		expect(body.user.email).toBe(email)

		// Should have session cookie
		const cookies = response.headers()['set-cookie']
		expect(cookies).toBeDefined()
	})

	test('cannot sign in with wrong password', async ({ request }) => {
		const email = `wrongpass-${Date.now()}@example.com`

		await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword, name: 'Wrong Pass Test' },
		})

		const response = await request.post('/api/auth/sign-in/email', {
			headers: { origin: ORIGIN },
			data: { email, password: 'WrongPassword123' },
		})

		expect(response.ok()).toBe(false)
	})

	test('can check session status after signup', async ({ request }) => {
		const email = `session-${Date.now()}@example.com`

		// Sign up (creates session)
		const signupResponse = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword, name: 'Session Test' },
		})
		expect(signupResponse.ok()).toBe(true)

		// Parse cookies from signup response
		const cookies = parseCookies(signupResponse.headers()['set-cookie'])

		// Check session with cookies
		const sessionResponse = await request.get('/api/auth/test', {
			headers: { cookie: cookies },
		})

		expect(sessionResponse.ok()).toBe(true)

		const body = await sessionResponse.json()
		expect(body.authenticated).toBe(true)
		expect(body.user.email).toBe(email)
	})

	test('can sign out', async ({ request }) => {
		const email = `signout-${Date.now()}@example.com`

		// Sign up
		const signupResponse = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword, name: 'Sign Out Test' },
		})
		expect(signupResponse.ok()).toBe(true)

		const cookies = parseCookies(signupResponse.headers()['set-cookie'])

		// Sign out
		const signoutResponse = await request.post('/api/auth/sign-out', {
			headers: {
				cookie: cookies,
				origin: ORIGIN,
			},
			data: {},
		})

		expect(signoutResponse.ok()).toBe(true)

		// Sign-out returns new cookies that clear the session - use those
		const clearedCookies = parseCookies(signoutResponse.headers()['set-cookie'])

		// Verify session is gone using the new (cleared) cookies
		const sessionResponse = await request.get('/api/auth/test', {
			headers: { cookie: clearedCookies || '' },
		})

		const body = await sessionResponse.json()
		expect(body.authenticated).toBe(false)
	})

	test('unauthenticated request returns not authenticated', async ({ request }) => {
		const response = await request.get('/api/auth/test')

		expect(response.ok()).toBe(true)

		const body = await response.json()
		expect(body.authenticated).toBe(false)
		expect(body.message).toBe('No active session')
	})
})
