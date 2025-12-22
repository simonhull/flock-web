import { getContext, setContext } from 'svelte'

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

const USER_CONTEXT_KEY = Symbol('user-context')

/**
 * Reactive user context using a getter function pattern.
 * This allows the context to be set during initialization with a getter
 * that returns the current reactive value.
 *
 * Usage:
 * - Parent: setUserContext(() => user) where user is $state
 * - Child: const getUser = getUserContext(); getUser() // returns current user
 */
export function setUserContext(getter: () => User | null): void {
	setContext(USER_CONTEXT_KEY, getter)
}

export function getUserContext(): User | null {
	const getter = getContext<() => User | null>(USER_CONTEXT_KEY)
	return getter()
}
