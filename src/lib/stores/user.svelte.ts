import { createContext } from 'svelte'

// User type matching App.Locals.user from app.d.ts
export interface User {
	id: string
	email: string
	name: string
	emailVerified: boolean
	image?: string | null | undefined
	createdAt: Date
	updatedAt: Date
}

/**
 * Typed context for the current user session.
 *
 * Usage:
 * - Parent: setUserContext(user)
 * - Child: const user = getUserContext()
 *
 * Throws if accessed before being set.
 */
export const [getUserContext, setUserContext] = createContext<User | null>()
