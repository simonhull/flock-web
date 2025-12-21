import { describe, expect, it, vi, beforeEach } from 'vitest'

import { createAuthService, type AuthResult } from './auth.service'

// Mock the auth module
vi.mock('../auth', () => ({
	createAuth: vi.fn(),
}))

import { createAuth } from '../auth'

const mockCreateAuth = vi.mocked(createAuth)

describe('AuthService', () => {
	const mockDb = {} as D1Database
	const baseURL = 'http://localhost:5173'
	const mockHeaders = new Headers()

	const mockUser = {
		id: 'user_123',
		email: 'test@example.com',
		name: 'Test User',
		createdAt: new Date(),
		updatedAt: new Date(),
		emailVerified: false,
		image: null,
	}

	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('signIn', () => {
		it('returns success with user when credentials are valid', async () => {
			const mockSignInEmail = vi.fn().mockResolvedValue({ user: mockUser })
			mockCreateAuth.mockReturnValue({
				api: { signInEmail: mockSignInEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signIn('test@example.com', 'password123', mockHeaders)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.email).toBe('test@example.com')
			}
			expect(mockSignInEmail).toHaveBeenCalledWith({
				body: { email: 'test@example.com', password: 'password123' },
				headers: mockHeaders,
			})
		})

		it('returns INVALID_CREDENTIALS when user is not found', async () => {
			const mockSignInEmail = vi.fn().mockResolvedValue({ user: null })
			mockCreateAuth.mockReturnValue({
				api: { signInEmail: mockSignInEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signIn('test@example.com', 'wrongpassword', mockHeaders)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.code).toBe('INVALID_CREDENTIALS')
				expect(result.message).toBe('Invalid email or password')
			}
		})

		it('returns INVALID_CREDENTIALS when signIn throws', async () => {
			const mockSignInEmail = vi.fn().mockRejectedValue(new Error('User not found'))
			mockCreateAuth.mockReturnValue({
				api: { signInEmail: mockSignInEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signIn('test@example.com', 'password123', mockHeaders)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.code).toBe('INVALID_CREDENTIALS')
			}
		})
	})

	describe('signUp', () => {
		it('returns success with user when registration succeeds', async () => {
			const mockSignUpEmail = vi.fn().mockResolvedValue({ user: mockUser })
			mockCreateAuth.mockReturnValue({
				api: { signUpEmail: mockSignUpEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signUp('test@example.com', 'password123', 'Test User', mockHeaders)

			expect(result.success).toBe(true)
			if (result.success) {
				expect(result.data.email).toBe('test@example.com')
			}
			expect(mockSignUpEmail).toHaveBeenCalledWith({
				body: { email: 'test@example.com', password: 'password123', name: 'Test User' },
				headers: mockHeaders,
			})
		})

		it('returns USER_EXISTS when email already exists', async () => {
			const mockSignUpEmail = vi.fn().mockRejectedValue(new Error('UNIQUE constraint failed'))
			mockCreateAuth.mockReturnValue({
				api: { signUpEmail: mockSignUpEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signUp('test@example.com', 'password123', 'Test User', mockHeaders)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.code).toBe('USER_EXISTS')
				expect(result.message).toBe('An account with this email already exists')
			}
		})

		it('returns UNKNOWN when registration fails for other reasons', async () => {
			const mockSignUpEmail = vi.fn().mockRejectedValue(new Error('Database error'))
			mockCreateAuth.mockReturnValue({
				api: { signUpEmail: mockSignUpEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signUp('test@example.com', 'password123', 'Test User', mockHeaders)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.code).toBe('UNKNOWN')
			}
		})

		it('returns UNKNOWN when signUp returns no user', async () => {
			const mockSignUpEmail = vi.fn().mockResolvedValue({ user: null })
			mockCreateAuth.mockReturnValue({
				api: { signUpEmail: mockSignUpEmail },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.signUp('test@example.com', 'password123', 'Test User', mockHeaders)

			expect(result.success).toBe(false)
			if (!result.success) {
				expect(result.code).toBe('UNKNOWN')
			}
		})
	})

	describe('signOut', () => {
		it('calls signOut on the auth API', async () => {
			const mockSignOut = vi.fn().mockResolvedValue(undefined)
			mockCreateAuth.mockReturnValue({
				api: { signOut: mockSignOut },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			await service.signOut(mockHeaders)

			expect(mockSignOut).toHaveBeenCalledWith({ headers: mockHeaders })
		})

		it('silently ignores signOut errors', async () => {
			const mockSignOut = vi.fn().mockRejectedValue(new Error('Session error'))
			mockCreateAuth.mockReturnValue({
				api: { signOut: mockSignOut },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			// Should not throw
			await expect(service.signOut(mockHeaders)).resolves.toBeUndefined()
		})
	})

	describe('getSession', () => {
		it('returns user when session exists', async () => {
			const mockGetSession = vi.fn().mockResolvedValue({ user: mockUser })
			mockCreateAuth.mockReturnValue({
				api: { getSession: mockGetSession },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.getSession(mockHeaders)

			expect(result).toEqual(mockUser)
			expect(mockGetSession).toHaveBeenCalledWith({ headers: mockHeaders })
		})

		it('returns null when no session exists', async () => {
			const mockGetSession = vi.fn().mockResolvedValue(null)
			mockCreateAuth.mockReturnValue({
				api: { getSession: mockGetSession },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.getSession(mockHeaders)

			expect(result).toBeNull()
		})

		it('returns null when getSession throws', async () => {
			const mockGetSession = vi.fn().mockRejectedValue(new Error('Session error'))
			mockCreateAuth.mockReturnValue({
				api: { getSession: mockGetSession },
			} as unknown as ReturnType<typeof createAuth>)

			const service = createAuthService(mockDb, baseURL)
			const result = await service.getSession(mockHeaders)

			expect(result).toBeNull()
		})
	})
})
