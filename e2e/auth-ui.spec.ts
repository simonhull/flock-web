import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { expect, test } from '@playwright/test'

const execAsync = promisify(exec)

/**
 * Helper to verify a user's email directly in the database.
 * This is used for E2E tests to simulate email verification without
 * needing to intercept emails or console output.
 */
async function verifyUserEmail(email: string): Promise<void> {
	const dbPath = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject'
	// Find the database file (the hash changes)
	const { stdout } = await execAsync(`find ${dbPath} -name "*.sqlite" | head -1`)
	const dbFile = stdout.trim()
	if (!dbFile) {
		throw new Error('Could not find D1 database file')
	}
	await execAsync(`sqlite3 "${dbFile}" "UPDATE user SET email_verified = 1 WHERE email = '${email}';"`)
}

test.describe('Registration Page', () => {
	test('displays registration form with all fields', async ({ page }) => {
		await page.goto('/register')
		await expect(page.getByRole('heading', { name: 'Create your account' })).toBeVisible()
		await expect(page.getByLabel('Email address')).toBeVisible()
		await expect(page.getByLabel('Password', { exact: true })).toBeVisible()
		await expect(page.getByLabel('Confirm password')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Create account' })).toBeVisible()
	})

	test('has link to login page', async ({ page }) => {
		await page.goto('/register')
		const loginLink = page.getByRole('link', { name: 'Sign in' })
		await expect(loginLink).toBeVisible()
		await expect(loginLink).toHaveAttribute('href', '/login')
	})

	test('shows validation error for password mismatch', async ({ page }) => {
		await page.goto('/register')
		await page.getByLabel('Email address').fill('test@example.com')
		await page.getByLabel('Password', { exact: true }).fill('password123')
		await page.getByLabel('Confirm password').fill('different123')
		await page.getByRole('button', { name: 'Create account' }).click()

		await expect(page.getByText('match', { exact: false })).toBeVisible({ timeout: 10000 })
	})

	test('successful registration redirects to verify-email page', async ({ page }) => {
		const email = `e2e-register-${Date.now()}@example.com`

		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')

		await Promise.all([
			page.waitForURL('**/verify-email', { timeout: 15000 }),
			page.getByRole('button', { name: 'Create account' }).click(),
		])
		await expect(page.getByText('Check Your Email')).toBeVisible({ timeout: 10000 })
		await expect(page.getByText('verification link')).toBeVisible({ timeout: 5000 })
	})

	test('form fields are focusable via keyboard', async ({ page }) => {
		await page.goto('/register')
		await page.getByLabel('Email address').focus()
		await expect(page.getByLabel('Email address')).toBeFocused()

		await page.keyboard.press('Tab')
		await expect(page.getByLabel('Password', { exact: true })).toBeFocused()

		await page.keyboard.press('Tab')
		await expect(page.getByLabel('Confirm password')).toBeFocused()

		await page.keyboard.press('Tab')
		await expect(page.getByRole('button', { name: 'Create account' })).toBeFocused()
	})
})

test.describe('Login Page', () => {
	test('displays login form with all fields', async ({ page }) => {
		await page.goto('/login')
		await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible()
		await expect(page.getByLabel('Email address')).toBeVisible()
		await expect(page.getByLabel('Password')).toBeVisible()
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
	})

	test('has link to register page', async ({ page }) => {
		await page.goto('/login')
		const registerLink = page.getByRole('link', { name: 'Create one' })
		await expect(registerLink).toBeVisible()
		await expect(registerLink).toHaveAttribute('href', '/register')
	})

	test('unverified user cannot sign in', async ({ page }) => {
		const email = `e2e-flow-${Date.now()}@example.com`

		// Register - redirects to verify-email
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL('/verify-email', { timeout: 15000 })

		// Navigate to login and try to sign in with unverified account
		await page.goto('/login')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Sign in' }).click()

		// BetterAuth with requireEmailVerification blocks unverified users from signing in
		// The user stays on login page with an error (prevents account enumeration)
		await expect(page).toHaveURL('/login')
		await expect(page.getByText(/invalid|error/i)).toBeVisible({ timeout: 5000 })
	})

	test('form fields are focusable via keyboard', async ({ page }) => {
		await page.goto('/login')
		await page.getByLabel('Email address').focus()
		await expect(page.getByLabel('Email address')).toBeFocused()

		await page.keyboard.press('Tab')
		await expect(page.getByLabel('Password')).toBeFocused()

		await page.keyboard.press('Tab')
		await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused()
	})
})

test.describe('Accessibility', () => {
	test('register form has proper ARIA labels', async ({ page }) => {
		await page.goto('/register')

		const emailInput = page.getByLabel('Email address')
		await expect(emailInput).toHaveAttribute('type', 'email')
		await expect(emailInput).toHaveAttribute('autocomplete', 'email')

		const passwordInput = page.getByLabel('Password', { exact: true })
		await expect(passwordInput).toHaveAttribute('type', 'password')
		await expect(passwordInput).toHaveAttribute('autocomplete', 'new-password')
	})

	test('login form has proper ARIA labels', async ({ page }) => {
		await page.goto('/login')

		const emailInput = page.getByLabel('Email address')
		await expect(emailInput).toHaveAttribute('type', 'email')
		await expect(emailInput).toHaveAttribute('autocomplete', 'email')

		const passwordInput = page.getByLabel('Password')
		await expect(passwordInput).toHaveAttribute('type', 'password')
		await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password')
	})

	test('page titles are descriptive', async ({ page }) => {
		await page.goto('/register')
		await expect(page).toHaveTitle(/Create Account/)

		await page.goto('/login')
		await expect(page).toHaveTitle(/Sign In/)
	})
})

test.describe('Dashboard - Verified User', () => {
	test('verified user sees "Verified" badge on dashboard', async ({ page }) => {
		const email = `e2e-verified-${Date.now()}@example.com`
		const password = 'SecurePass123!'

		// Step 1: Register a new user
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill(password)
		await page.getByLabel('Confirm password').fill(password)
		await page.getByRole('button', { name: 'Create account' }).click()

		// Wait for redirect to verify-email page (may include query params)
		await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 })

		// Step 2: Verify the email directly in the database
		// This simulates clicking the verification link
		await verifyUserEmail(email)

		// Step 3: Sign in with the verified account
		await page.goto('/login')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password').fill(password)
		await page.getByRole('button', { name: 'Sign in' }).click()

		// Step 4: Should be redirected to dashboard
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

		// Step 5: Verify the "Verified" badge is shown (not "Not verified")
		// This tests the fix for the context timing bug
		await expect(page.getByText('Verified', { exact: true })).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('Not verified', { exact: true })).not.toBeVisible()
	})

	test('dashboard shows user email', async ({ page }) => {
		const email = `e2e-dashboard-${Date.now()}@example.com`
		const password = 'SecurePass123!'

		// Register
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill(password)
		await page.getByLabel('Confirm password').fill(password)
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL(/\/verify-email/, { timeout: 15000 })

		// Verify email
		await verifyUserEmail(email)

		// Sign in
		await page.goto('/login')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password').fill(password)
		await page.getByRole('button', { name: 'Sign in' }).click()

		// Check dashboard shows the user's email
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
		await expect(page.getByText(email)).toBeVisible()
	})
})
