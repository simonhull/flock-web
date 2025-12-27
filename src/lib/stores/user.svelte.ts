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
 * User context using a getter function pattern.
 *
 * Usage:
 * - Parent (UserProvider): setUserContext(() => user)
 * - Child: const user = getUserContext()
 *
 * The UserProvider component ensures the user is resolved before
 * children render, so getUserContext() returns the correct value.
 */
export function setUserContext(getter: () => User | null): void {
	setContext(USER_CONTEXT_KEY, getter)
}

/**
 * Returns the current user from context.
 * Must be called within a component that's a child of UserProvider.
 */
export function getUserContext(): User | null {
	const getter = getContext<() => User | null>(USER_CONTEXT_KEY)
	return getter()
}
