import { describe, expect, it } from 'vitest'
import * as schema from './schema'

describe('schema', () => {
	describe('user table', () => {
		it('has correct columns for BetterAuth', () => {
			const columns = Object.keys(schema.user)
			expect(columns).toContain('id')
			expect(columns).toContain('name')
			expect(columns).toContain('email')
			expect(columns).toContain('emailVerified')
			expect(columns).toContain('image')
			expect(columns).toContain('createdAt')
			expect(columns).toContain('updatedAt')
		})
	})

	describe('session table', () => {
		it('has correct columns for BetterAuth', () => {
			const columns = Object.keys(schema.session)
			expect(columns).toContain('id')
			expect(columns).toContain('userId')
			expect(columns).toContain('token')
			expect(columns).toContain('expiresAt')
			expect(columns).toContain('ipAddress')
			expect(columns).toContain('userAgent')
			expect(columns).toContain('createdAt')
			expect(columns).toContain('updatedAt')
		})
	})

	describe('account table', () => {
		it('has correct columns for BetterAuth', () => {
			const columns = Object.keys(schema.account)
			expect(columns).toContain('id')
			expect(columns).toContain('userId')
			expect(columns).toContain('accountId')
			expect(columns).toContain('providerId')
			expect(columns).toContain('accessToken')
			expect(columns).toContain('refreshToken')
			expect(columns).toContain('password')
			expect(columns).toContain('createdAt')
			expect(columns).toContain('updatedAt')
		})
	})

	describe('verification table', () => {
		it('has correct columns for BetterAuth', () => {
			const columns = Object.keys(schema.verification)
			expect(columns).toContain('id')
			expect(columns).toContain('identifier')
			expect(columns).toContain('value')
			expect(columns).toContain('expiresAt')
			expect(columns).toContain('createdAt')
			expect(columns).toContain('updatedAt')
		})
	})

	describe('profile table', () => {
		it('has correct columns for portable identity', () => {
			const columns = Object.keys(schema.profile)
			expect(columns).toContain('id')
			expect(columns).toContain('userId')
			expect(columns).toContain('displayName')
			expect(columns).toContain('bio')
			expect(columns).toContain('avatarUrl')
			expect(columns).toContain('city')
			expect(columns).toContain('state')
			expect(columns).toContain('country')
			expect(columns).toContain('isPublic')
			expect(columns).toContain('createdAt')
			expect(columns).toContain('updatedAt')
		})
	})

	describe('type exports', () => {
		it('exports User types', () => {
			// Type-level check - if this compiles, types are exported
			const _user: schema.User = {} as schema.User
			const _newUser: schema.NewUser = {} as schema.NewUser
			expect(true).toBe(true)
		})

		it('exports Profile types', () => {
			const _profile: schema.Profile = {} as schema.Profile
			const _newProfile: schema.NewProfile = {} as schema.NewProfile
			expect(true).toBe(true)
		})

		it('exports Session types', () => {
			const _session: schema.Session = {} as schema.Session
			const _newSession: schema.NewSession = {} as schema.NewSession
			expect(true).toBe(true)
		})
	})
})
