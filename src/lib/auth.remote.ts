import { error, invalid, redirect } from '@sveltejs/kit'
import { command, form, getRequestEvent, query } from '$app/server'
import * as v from 'valibot'

import { createAuth } from '$lib/server/auth'

// ============================================================================
// Helpers
// ============================================================================

function getAuth() {
	const event = getRequestEvent()
	const db = event.platform?.env?.DB

	if (!db) {
		error(503, 'Database not available')
	}

	return createAuth(db, {
		baseURL: event.url.origin,
	})
}

// ============================================================================
// Queries
// ============================================================================

export const getUser = query(async () => {
	const event = getRequestEvent()
	const db = event.platform?.env?.DB

	if (!db) return null

	const auth = createAuth(db, { baseURL: event.url.origin })
	const session = await auth.api.getSession({
		headers: event.request.headers,
	})

	return session?.user ?? null
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
	const auth = getAuth()
	const event = getRequestEvent()

	try {
		const response = await auth.api.signUpEmail({
			body: {
				email: data.email,
				password: data._password,
				name: data.email.split('@').at(0) ?? 'User',
			},
			headers: event.request.headers,
		})

		if (!response.user) {
			invalid(issue.email('Registration failed. Please try again.'))
		}
	}
	catch (err) {
		const message = err instanceof Error ? err.message : ''

		if (message.includes('UNIQUE constraint') || message.includes('already exists')) {
			invalid(issue.email('An account with this email already exists'))
		}

		invalid(issue.email('Registration failed. Please try again.'))
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
	const auth = getAuth()
	const event = getRequestEvent()

	try {
		const response = await auth.api.signInEmail({
			body: {
				email: data.email,
				password: data._password,
			},
			headers: event.request.headers,
		})

		if (!response.user) {
			invalid(issue.email('Invalid email or password'))
		}
	}
	catch {
		invalid(issue.email('Invalid email or password'))
	}

	redirect(303, '/dashboard')
})

// ============================================================================
// Commands
// ============================================================================

export const logout = command(async () => {
	const auth = getAuth()
	const event = getRequestEvent()

	try {
		await auth.api.signOut({
			headers: event.request.headers,
		})
	}
	catch {
		// Ignore sign out errors
	}
})
