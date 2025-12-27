import { error, invalid, redirect } from '@sveltejs/kit'
import { command, form, getRequestEvent, query } from '$app/server'
import * as v from 'valibot'

import { createEmailService } from '$lib/server/email'
import { createAuthService } from '$lib/server/services/auth.service'
import { safeRedirect } from '$lib/utils/url'

// ============================================================================
// Helpers
// ============================================================================

function getAuthService() {
	const event = getRequestEvent()
	const db = event.platform?.env?.DB

	if (!db) {
		error(503, 'Database not available')
	}

	const emailService = createEmailService({
		provider: (event.platform?.env?.EMAIL_PROVIDER as 'console' | 'zepto') ?? 'console',
		zepto: {
			token: event.platform?.env?.ZEPTO_MAIL_TOKEN ?? '',
			from: event.platform?.env?.ZEPTO_MAIL_FROM ?? 'noreply@myflock.app',
			fromName: event.platform?.env?.ZEPTO_MAIL_FROM_NAME ?? 'Flock',
		},
	})

	return createAuthService(db, event.url.origin, emailService)
}

// ============================================================================
// Queries
// ============================================================================

export const getUser = query(async () => {
	const event = getRequestEvent()
	const db = event.platform?.env?.DB

	if (!db) return null

	const emailService = createEmailService({
		provider: (event.platform?.env?.EMAIL_PROVIDER as 'console' | 'zepto') ?? 'console',
		zepto: {
			token: event.platform?.env?.ZEPTO_MAIL_TOKEN ?? '',
			from: event.platform?.env?.ZEPTO_MAIL_FROM ?? 'noreply@myflock.app',
			fromName: event.platform?.env?.ZEPTO_MAIL_FROM_NAME ?? 'Flock',
		},
	})

	const authService = createAuthService(db, event.url.origin, emailService)
	return authService.getSession(event.request.headers)
})

// ============================================================================
// Forms
// ============================================================================

const RegisterSchema = v.pipe(
	v.object({
		email: v.pipe(
			v.string('Email is required'),
			v.trim(),
			v.email('Please enter a valid email'),
			v.maxLength(255, 'Email is too long'),
		),
		_password: v.pipe(
			v.string('Password is required'),
			v.minLength(8, 'Password must be at least 8 characters'),
			v.maxLength(128, 'Password is too long'),
		),
		_confirmPassword: v.string('Please confirm your password'),
	}),
	v.forward(
		v.check(
			input => input._password === input._confirmPassword,
			'Passwords do not match',
		),
		['_confirmPassword'],
	),
)

export const register = form(RegisterSchema, async (data, issue) => {
	const authService = getAuthService()
	const event = getRequestEvent()

	const result = await authService.signUp(
		data.email,
		data._password,
		data.email.split('@').at(0) ?? 'User',
		event.request.headers,
	)

	if (!result.success) {
		invalid(issue.email(result.message))
	}

	// With autoSignIn: false, no session is created on sign-up
	// User must verify email before they can sign in
	const email = encodeURIComponent(data.email)
	redirect(303, `/verify-email?email=${email}`)
})

const LoginSchema = v.object({
	email: v.pipe(
		v.string('Email is required'),
		v.trim(),
		v.email('Please enter a valid email'),
	),
	_password: v.string('Password is required'),
	_redirectTo: v.string(),
})

export const login = form(LoginSchema, async (data, issue) => {
	const authService = getAuthService()
	const event = getRequestEvent()

	const result = await authService.signIn(
		data.email,
		data._password,
		event.request.headers,
	)

	if (!result.success) {
		// Show specific message for unverified email
		if (result.code === 'EMAIL_NOT_VERIFIED') {
			redirect(303, '/verify-email')
		}
		invalid(issue.email(result.message))
	}

	redirect(303, safeRedirect(data._redirectTo))
})

const ForgotPasswordSchema = v.object({
	email: v.pipe(
		v.string('Email is required'),
		v.trim(),
		v.email('Please enter a valid email'),
	),
})

export const forgotPassword = form(ForgotPasswordSchema, async (data) => {
	const authService = getAuthService()
	const event = getRequestEvent()

	// Always succeed (security: don't reveal if email exists)
	await authService.requestPasswordReset(data.email, `${event.url.origin}/reset-password`)

	redirect(303, '/forgot-password?sent=true')
})

// ============================================================================
// Commands
// ============================================================================

export const logout = command(async () => {
	const authService = getAuthService()
	const event = getRequestEvent()

	await authService.signOut(event.request.headers)
})
