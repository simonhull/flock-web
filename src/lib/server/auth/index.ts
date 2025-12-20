import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { drizzle } from 'drizzle-orm/d1'
import * as schema from '../db/schema'

export function createAuth(d1: D1Database, options?: { baseURL?: string }) {
	const db = drizzle(d1, { schema })

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
			schema,
		}),

		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false, // Enable in TASK-001f
		},

		session: {
			expiresIn: 60 * 60 * 24 * 30, // 30 days
			updateAge: 60 * 60 * 24, // Refresh session daily
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5, // 5 minute cache
			},
		},

		baseURL: options?.baseURL ?? 'http://localhost:5173',

		trustedOrigins: [
			'http://localhost:5173',
			'http://localhost:4173',
			'http://localhost:8788',
		],

		// Create profile when user signs up
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						// User is guaranteed to exist after creation
						if (!user.id) return
						const displayName = user.name ?? user.email.split('@')[0]
						await db.insert(schema.profile).values({
							userId: user.id,
							displayName,
						})
					},
				},
			},
		},
	})
}

export type Auth = ReturnType<typeof createAuth>
