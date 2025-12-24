import type { User } from 'better-auth'
import { APIError } from 'better-auth/api'

import type { EmailService } from '$lib/server/email'

import { createAuth } from '../auth'

// ============================================================================
// Types
// ============================================================================

export type AuthErrorCode = 'INVALID_CREDENTIALS' | 'USER_EXISTS' | 'EMAIL_NOT_VERIFIED' | 'UNKNOWN'

export type AuthResult<T> =
	| { success: true; data: T }
	| { success: false; code: AuthErrorCode; message: string }

export interface AuthService {
	signIn(email: string, password: string, headers: Headers): Promise<AuthResult<User>>
	signUp(email: string, password: string, name: string, headers: Headers): Promise<AuthResult<User>>
	signOut(headers: Headers): Promise<void>
	getSession(headers: Headers): Promise<User | null>
}

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<AuthErrorCode, string> = {
	INVALID_CREDENTIALS: 'Invalid email or password',
	USER_EXISTS: 'An account with this email already exists',
	EMAIL_NOT_VERIFIED: 'Please verify your email address',
	UNKNOWN: 'Something went wrong. Please try again.',
}

// ============================================================================
// Service Factory
// ============================================================================

export function createAuthService(
	db: D1Database,
	baseURL: string,
	emailService: EmailService,
): AuthService {
	const auth = createAuth(db, { baseURL, emailService })

	return {
		async signIn(email, password, headers) {
			try {
				const response = await auth.api.signInEmail({
					body: { email, password },
					headers,
				})

				if (!response.user) {
					return {
						success: false,
						code: 'INVALID_CREDENTIALS',
						message: ERROR_MESSAGES.INVALID_CREDENTIALS,
					}
				}

				return { success: true, data: response.user }
			}
			catch (err) {
				// BetterAuth returns APIError with status 403 for unverified email
				if (err instanceof APIError) {
					if (err.status === 403 || err.message?.toLowerCase().includes('verify')) {
						return {
							success: false,
							code: 'EMAIL_NOT_VERIFIED',
							message: ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
						}
					}
				}

				// Also check for non-APIError cases
				const message = err instanceof Error ? err.message : ''
				if (message.toLowerCase().includes('verify') || message.toLowerCase().includes('verification')) {
					return {
						success: false,
						code: 'EMAIL_NOT_VERIFIED',
						message: ERROR_MESSAGES.EMAIL_NOT_VERIFIED,
					}
				}

				return {
					success: false,
					code: 'INVALID_CREDENTIALS',
					message: ERROR_MESSAGES.INVALID_CREDENTIALS,
				}
			}
		},

		async signUp(email, password, name, headers) {
			try {
				const response = await auth.api.signUpEmail({
					body: { email, password, name },
					headers,
				})

				if (!response.user) {
					return {
						success: false,
						code: 'UNKNOWN',
						message: ERROR_MESSAGES.UNKNOWN,
					}
				}

				return { success: true, data: response.user }
			}
			catch (err) {
				const message = err instanceof Error ? err.message : ''

				if (message.includes('UNIQUE constraint') || message.includes('already exists')) {
					return {
						success: false,
						code: 'USER_EXISTS',
						message: ERROR_MESSAGES.USER_EXISTS,
					}
				}

				return {
					success: false,
					code: 'UNKNOWN',
					message: ERROR_MESSAGES.UNKNOWN,
				}
			}
		},

		async signOut(headers) {
			try {
				await auth.api.signOut({ headers })
			}
			catch {
				// Ignore sign out errors
			}
		},

		async getSession(headers) {
			try {
				const session = await auth.api.getSession({ headers })
				return session?.user ?? null
			}
			catch {
				return null
			}
		},
	}
}
