import { dev } from '$app/environment'
import { getRequestEvent } from '$app/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { bearer } from 'better-auth/plugins'
import { sveltekitCookies } from 'better-auth/svelte-kit'
import { drizzle } from 'drizzle-orm/d1'

import type { EmailService } from '$lib/server/email'

import * as schema from '../db/schema'

// Local development origins
const DEV_ORIGINS = [
	'http://localhost:5173',
	'http://localhost:4173',
	'http://localhost:8788',
]

export interface AuthOptions {
	baseURL: string
	emailService: EmailService
}

export function createAuth(d1: D1Database, options: AuthOptions) {
	const db = drizzle(d1, { schema })

	// Trust the current origin + dev origins in development
	const trustedOrigins = dev
		? [...new Set([options.baseURL, ...DEV_ORIGINS])]
		: [options.baseURL]

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema,
		}),

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: true,
			autoSignIn: false, // Don't create session on sign-up; user must verify email first
			sendResetPassword: async ({ user, url }) => {
				await options.emailService.sendPasswordResetEmail({
					to: user.email,
					name: user.name ?? user.email.split('@')[0],
					resetUrl: url,
				})
			},
		},

		emailVerification: {
			sendOnSignUp: true,
			autoSignInAfterVerification: false,
			sendVerificationEmail: async ({ user, url }) => {
				await options.emailService.sendVerificationEmail({
					to: user.email,
					name: user.name ?? user.email.split('@')[0],
					verificationUrl: url,
				})
			},
		},

		session: {
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24, // Refresh session daily
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5, // 5 minute cache
			},
		},

		baseURL: options.baseURL,

		trustedOrigins,

		// Create profile when user signs up
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						// User is guaranteed to exist after creation
						if (!user.id)
							return
						const displayName = user.name ?? user.email.split('@')[0]
						await db.insert(schema.profile).values({
							userId: user.id,
							displayName,
						})
					},
				},
			},
		},

		// Plugins:
		// - sveltekitCookies: Handle cookies in SvelteKit form actions
		// - bearer: Accept Bearer token auth for mobile clients
		plugins: [sveltekitCookies(getRequestEvent), bearer()],
	})
}

export type Auth = ReturnType<typeof createAuth>
