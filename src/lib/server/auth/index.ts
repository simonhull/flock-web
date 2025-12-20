import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { createDb } from '../db'

export function createAuth(d1: D1Database) {
	const db = createDb(d1)

	return betterAuth({
		database: drizzleAdapter(db, {
			provider: 'sqlite',
		}),
		emailAndPassword: {
			enabled: true,
		},
	})
}

export type Auth = ReturnType<typeof createAuth>
