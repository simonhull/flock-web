import { expect, test } from '@playwright/test'

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

	test('successful registration redirects to dashboard', async ({ page }) => {
		const email = `e2e-register-${Date.now()}@example.com`

		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')

		await Promise.all([
			page.waitForURL('**/dashboard', { timeout: 15000 }),
			page.getByRole('button', { name: 'Create account' }).click(),
		])
		await expect(page.getByRole('heading', { name: 'Flock', exact: true })).toBeVisible({ timeout: 10000 })
		await expect(page.getByText('Welcome')).toBeVisible({ timeout: 5000 })
		await expect(page.getByText('signed in as')).toBeVisible({ timeout: 5000 })
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

	test('full auth flow: register, logout, login', async ({ page }) => {
		const email = `e2e-flow-${Date.now()}@example.com`

		// Register
		await page.goto('/register')
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password', { exact: true }).fill('SecurePass123')
		await page.getByLabel('Confirm password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Create account' }).click()
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })

		// Logout
		await Promise.all([
			page.waitForURL('/login', { timeout: 15000 }),
			page.getByRole('button', { name: 'Sign out' }).click()
		])

		// Login
		await page.getByLabel('Email address').fill(email)
		await page.getByLabel('Password').fill('SecurePass123')
		await page.getByRole('button', { name: 'Sign in' }).click()
		await expect(page).toHaveURL('/dashboard', { timeout: 15000 })
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
