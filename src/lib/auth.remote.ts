import { error, invalid, redirect } from '@sveltejs/kit'
import { command, form, getRequestEvent, query } from '$app/server'
import * as v from 'valibot'

import { createAuthService } from '$lib/server/services/auth.service'

// ============================================================================
// Helpers
// ============================================================================

function getAuthService() {
	const event = getRequestEvent()
	const db = event.platform?.env?.DB

	if (!db) {
		error(503, 'Database not available')
	}

	return createAuthService(db, event.url.origin)
}

// ============================================================================
// Queries
// ============================================================================

export const getUser = query(async () => {
	const event = getRequestEvent()
	const db = event.platform?.env?.DB

	if (!db) return null

	const authService = createAuthService(db, event.url.origin)
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

	redirect(303, '/dashboard')
})

const LoginSchema = v.object({
	email: v.pipe(
		v.string('Email is required'),
		v.trim(),
		v.email('Please enter a valid email'),
	),
	_password: v.string('Password is required'),
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
		invalid(issue.email(result.message))
	}

	redirect(303, '/dashboard')
})

// ============================================================================
// Commands
// ============================================================================

export const logout = command(async () => {
	const authService = getAuthService()
	const event = getRequestEvent()

	await authService.signOut(event.request.headers)
})
