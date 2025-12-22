import { expect, test } from '@playwright/test'

test.describe('Protected Routes', () => {
	test('redirects unauthenticated user to login with return URL', async ({ page }) => {
		await page.goto('/dashboard')
		await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/)
	})

	test('redirects back to original destination after login', async ({ page }) => {
		const email = `e2e-redirect-${Date.now()}@example.com`

		// Try to access dashboard (should redirect to login)
		await page.goto('/dashboard')
		await expect(page).toHaveURL(/\/login\?redirectTo=/)

		// Click "Create one" to register instead
		await page.getByRole('link', { name: 'Create one' }).click()

		// Register
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()

		// Should land on dashboard (the original destination)
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
	})

	test('login with redirectTo sends user to original destination', async ({ page }) => {
		const email = `e2e-login-redirect-${Date.now()}@example.com`

		// First, register to create an account
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

		// Logout
		await Promise.all([
			page.waitForURL('/login', { timeout: 15000 }),
			page.getByRole('button', { name: 'Sign out' }).click(),
		])

		// Try to access dashboard directly (should redirect to login with redirectTo)
		await page.goto('/dashboard')
		await expect(page).toHaveURL(/\/login\?redirectTo=%2Fdashboard/)

		// Login
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Sign in' }).click()

		// Should redirect back to dashboard
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
	})

	test('authenticated user bounces from login to dashboard', async ({ page }) => {
		const email = `e2e-bounce-${Date.now()}@example.com`

		// Register (auto-signs in)
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

		// Try to visit login page while authenticated
		await page.goto('/login')

		// Should redirect back to dashboard
		await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
	})

	test('authenticated user bounces from register to dashboard', async ({ page }) => {
		const email = `e2e-bounce-reg-${Date.now()}@example.com`

		// Register (auto-signs in)
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

		// Try to visit register page while authenticated
		await page.goto('/register')

		// Should redirect back to dashboard
		await expect(page).toHaveURL('/dashboard', { timeout: 5000 })
	})
})
