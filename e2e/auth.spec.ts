import { expect, test } from '@playwright/test'

/**
 * Helper to parse set-cookie header and extract cookie name=value pairs
 */
function parseCookies(setCookieHeader: string | undefined): string {
	if (!setCookieHeader)
		return ''
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

	test('cannot sign in with unverified email', async ({ request }) => {
		const email = `signin-${Date.now()}@example.com`

		// Create user first (unverified)
		const signupResponse = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword, name: 'Sign In Test' },
		})
		expect(signupResponse.ok()).toBe(true)

		// Sign in attempt should fail because email is not verified
		const response = await request.post('/api/auth/sign-in/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword },
		})

		// With requireEmailVerification: true, sign-in should fail for unverified users
		expect(response.ok()).toBe(false)
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

	test('signup with requireEmailVerification does not create active session', async ({ request }) => {
		const email = `session-${Date.now()}@example.com`

		// Sign up (with requireEmailVerification: true, no session is created until verified)
		const signupResponse = await request.post('/api/auth/sign-up/email', {
			headers: { origin: ORIGIN },
			data: { email, password: testPassword, name: 'Session Test' },
		})
		expect(signupResponse.ok()).toBe(true)

		// Parse cookies from signup response
		const cookies = parseCookies(signupResponse.headers()['set-cookie'])

		// Check session with cookies - should NOT be authenticated
		// BetterAuth with requireEmailVerification: true doesn't create sessions until email is verified
		const sessionResponse = await request.get('/api/auth/test', {
			headers: { cookie: cookies },
		})

		expect(sessionResponse.ok()).toBe(true)

		const body = await sessionResponse.json()
		expect(body.authenticated).toBe(false)
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

test.describe('Email Verification', () => {
	test('register redirects to verify-email page', async ({ page }) => {
		const email = `verify-${Date.now()}@example.com`

		await page.goto('/register')
		await page.fill('input[id="email"]', email)
		await page.fill('input[id="password"]', 'SecurePass123!')
		await page.fill('input[id="confirmPassword"]', 'SecurePass123!')
		await page.click('button[type="submit"]')

		// Should redirect to verify-email page (not dashboard)
		await expect(page).toHaveURL('/verify-email')
		await expect(page.locator('text=Check Your Email')).toBeVisible()
	})

	test('verify-email page shows check email message without token', async ({ page }) => {
		await page.goto('/verify-email')
		await expect(page.locator('text=Check Your Email')).toBeVisible()
		await expect(page.locator('text=Resend verification email')).toBeVisible()
	})

	test('verify-email with invalid token shows error', async ({ page }) => {
		await page.goto('/verify-email?token=invalid-token-12345')

		// Should show error after attempting verification
		await expect(page.locator('text=Verification Failed')).toBeVisible({ timeout: 10000 })
	})

	test('verify-email page is accessible without authentication', async ({ page }) => {
		// Should not redirect to login
		const response = await page.goto('/verify-email')
		expect(response?.url()).toContain('/verify-email')
		expect(response?.url()).not.toContain('/login')
	})
})

test.describe('Password Reset', () => {
	test('forgot password page renders', async ({ page }) => {
		await page.goto('/forgot-password')
		await expect(page.getByRole('heading', { name: /forgot your password/i })).toBeVisible()
		await expect(page.getByLabel('Email address')).toBeVisible()
		await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
	})

	test('forgot password shows success after submit', async ({ page }) => {
		await page.goto('/forgot-password')
		await page.getByLabel('Email address').fill('test@example.com')
		await page.getByRole('button', { name: /send reset link/i }).click()

		// Should show success message (even for non-existent emails for security)
		await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 })
	})

	test('forgot password validates email', async ({ page }) => {
		await page.goto('/forgot-password')
		await page.getByLabel('Email address').fill('not-an-email')
		await page.getByRole('button', { name: /send reset link/i }).click()

		// Form should stay on page (not redirect to success) for invalid email
		// Wait a moment for server response
		await page.waitForTimeout(1000)
		// Should still show the form heading (not success page)
		await expect(page.getByRole('heading', { name: /forgot your password/i })).toBeVisible()
		// The button should still be visible (form didn't redirect)
		await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible()
	})

	test('reset password without token shows error', async ({ page }) => {
		await page.goto('/reset-password')
		await expect(page.getByText('Invalid Reset Link')).toBeVisible()
		await expect(page.getByRole('link', { name: /request new link/i })).toBeVisible()
	})

	test('reset password with token shows form', async ({ page }) => {
		await page.goto('/reset-password?token=some-test-token')
		await expect(page.getByRole('heading', { name: /reset your password/i })).toBeVisible()
		await expect(page.getByLabel('New password', { exact: true })).toBeVisible()
		await expect(page.getByLabel('Confirm new password', { exact: true })).toBeVisible()
	})

	test('reset password validates matching passwords', async ({ page }) => {
		await page.goto('/reset-password?token=test-token')
		await page.getByLabel('New password', { exact: true }).fill('NewPass123!')
		await page.getByLabel('Confirm new password', { exact: true }).fill('DifferentPass!')
		await page.getByRole('button', { name: /reset password/i }).click()

		await expect(page.getByText('Passwords do not match')).toBeVisible({ timeout: 5000 })
	})

	test('reset password validates minimum length', async ({ page }) => {
		await page.goto('/reset-password?token=test-token')
		await page.getByLabel('New password', { exact: true }).fill('short')
		await page.getByLabel('Confirm new password', { exact: true }).fill('short')
		await page.getByRole('button', { name: /reset password/i }).click()

		// Look specifically for the error message (not the hint text)
		await expect(page.getByText('Password must be at least 8 characters')).toBeVisible({ timeout: 5000 })
	})

	test('login page has forgot password link', async ({ page }) => {
		await page.goto('/login')
		const forgotLink = page.getByRole('link', { name: /forgot your password/i })
		await expect(forgotLink).toBeVisible()
		await expect(forgotLink).toHaveAttribute('href', '/forgot-password')
	})

	test('forgot password page has login link', async ({ page }) => {
		await page.goto('/forgot-password')
		const loginLink = page.getByRole('link', { name: /sign in/i })
		await expect(loginLink).toBeVisible()
		await expect(loginLink).toHaveAttribute('href', '/login')
	})
})
