import { expect, test } from '@playwright/test'

test.describe('Protected Routes', () => {
	test('redirects unauthenticated user to login with return URL', async ({ page }) => {
		await page.goto('/dashboard')
		await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/)
	})

	test('registration redirects to verify-email page', async ({ page }) => {
		const email = `e2e-redirect-${Date.now()}@example.com`

		// Try to access dashboard (should redirect to login)
		await page.goto('/dashboard')
		await expect(page).toHaveURL(/\/login\?redirectTo=/)

		// Click "Create one" to register instead
		await page.getByRole('link', { name: 'Create one' }).click()
		await expect(page).toHaveURL(/\/register/)

		// Register
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()

		// With email verification enabled, should go to verify-email page
		await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 })
	})

	test('unverified user cannot access dashboard', async ({ page }) => {
		const email = `e2e-login-redirect-${Date.now()}@example.com`

		// Register (creates unverified user)
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()

		// Should redirect to verify-email
		await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 })

		// Try to access dashboard directly
		await page.goto('/dashboard')

		// Should redirect to login or stay on verify-email (unverified users can't access dashboard)
		await expect(page).not.toHaveURL('/dashboard', { timeout: 5000 })
	})

	// Note: With BetterAuth's requireEmailVerification: true, no session is created
	// on signup until the email is verified. Therefore, "authenticated but unverified"
	// users don't exist - they're simply unauthenticated until they verify and sign in.
	// The following tests verify this behavior:

	test('after registration user is not authenticated (no session until verified)', async ({ page }) => {
		const email = `e2e-no-session-${Date.now()}@example.com`

		// Register - redirects to verify-email
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 })

		// Try to visit login page - should stay on login (user is not authenticated)
		await page.goto('/login')
		await expect(page).toHaveURL('/login')

		// Try to visit register page - should stay on register (user is not authenticated)
		await page.goto('/register')
		await expect(page).toHaveURL('/register')
	})
})
