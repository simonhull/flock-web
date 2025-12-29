import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/d1'
import * as v from 'valibot'

import * as schema from '../db/schema'
import type { Gender, Profile } from '../db/schema'

// ============================================================================
// Types
// ============================================================================

export type ProfileErrorCode =
	| 'PROFILE_EXISTS'
	| 'PROFILE_NOT_FOUND'
	| 'VALIDATION_ERROR'
	| 'UNKNOWN'

export type ProfileResult<T> =
	| { success: true; data: T }
	| { success: false; code: ProfileErrorCode; message: string }

export interface CreateProfileInput {
	firstName: string
	lastName: string
	birthday: string // ISO date 'YYYY-MM-DD'
	gender: Gender
	avatarUrl?: string | null
}

export interface UpdateProfileInput {
	firstName?: string
	lastName?: string
	birthday?: string
	gender?: Gender
	phoneNumber?: string | null
	avatarUrl?: string | null
	bio?: string | null
}

export interface ProfileService {
	getByUserId(userId: string): Promise<Profile | null>
	create(userId: string, input: CreateProfileInput): Promise<ProfileResult<Profile>>
	update(userId: string, input: UpdateProfileInput): Promise<ProfileResult<Profile>>
	isOnboardingComplete(userId: string): Promise<boolean>
}

// ============================================================================
// Validation Schemas
// ============================================================================

const NameSchema = v.pipe(
	v.string(),
	v.trim(),
	v.minLength(1, 'Name is required'),
	v.maxLength(100, 'Name is too long'),
)

const BirthdaySchema = v.pipe(
	v.string(),
	v.regex(/^\d{4}-\d{2}-\d{2}$/, 'Birthday must be in YYYY-MM-DD format'),
	v.check((value) => {
		const date = new Date(value)
		const now = new Date()
		const minAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate())
		return date <= minAge
	}, 'Must be at least 13 years old'),
)

const GenderSchema = v.picklist(
	schema.genderEnum,
	'Gender must be male, female, or prefer_not_to_say',
)

const CreateProfileSchema = v.object({
	firstName: NameSchema,
	lastName: NameSchema,
	birthday: BirthdaySchema,
	gender: GenderSchema,
	avatarUrl: v.optional(v.nullable(v.pipe(v.string(), v.url()))),
})

const UpdateProfileSchema = v.object({
	firstName: v.optional(NameSchema),
	lastName: v.optional(NameSchema),
	birthday: v.optional(BirthdaySchema),
	gender: v.optional(GenderSchema),
	phoneNumber: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(20)))),
	avatarUrl: v.optional(v.nullable(v.pipe(v.string(), v.url()))),
	bio: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(500)))),
})

// ============================================================================
// Error Messages
// ============================================================================

const ERROR_MESSAGES: Record<ProfileErrorCode, string> = {
	PROFILE_EXISTS: 'Profile already exists for this user',
	PROFILE_NOT_FOUND: 'Profile not found',
	VALIDATION_ERROR: 'Invalid profile data',
	UNKNOWN: 'Something went wrong. Please try again.',
}

// ============================================================================
// Service Factory
// ============================================================================

export function createProfileService(d1: D1Database): ProfileService {
	const db = drizzle(d1, { schema })

	return {
		async getByUserId(userId) {
			const result = await db
				.select()
				.from(schema.profile)
				.where(eq(schema.profile.userId, userId))
				.get()

			return result ?? null
		},

		async create(userId, input) {
			// Validate input
			const parsed = v.safeParse(CreateProfileSchema, input)
			if (!parsed.success) {
				const firstIssue = parsed.issues[0]
				return {
					success: false,
					code: 'VALIDATION_ERROR',
					message: firstIssue?.message ?? ERROR_MESSAGES.VALIDATION_ERROR,
				}
			}

			// Check if profile already exists
			const existing = await this.getByUserId(userId)
			if (existing) {
				return {
					success: false,
					code: 'PROFILE_EXISTS',
					message: ERROR_MESSAGES.PROFILE_EXISTS,
				}
			}

			const { firstName, lastName, birthday, gender, avatarUrl } = parsed.output

			try {
				const [profile] = await db
					.insert(schema.profile)
					.values({
						userId,
						firstName,
						lastName,
						birthday,
						gender,
						displayName: `${firstName} ${lastName}`,
						avatarUrl: avatarUrl ?? null,
						onboardingComplete: true,
					})
					.returning()

				if (!profile) {
					return {
						success: false,
						code: 'UNKNOWN',
						message: ERROR_MESSAGES.UNKNOWN,
					}
				}

				return { success: true, data: profile }
			}
			catch (err) {
				const message = err instanceof Error ? err.message : ''

				if (message.includes('UNIQUE constraint')) {
					return {
						success: false,
						code: 'PROFILE_EXISTS',
						message: ERROR_MESSAGES.PROFILE_EXISTS,
					}
				}

				return {
					success: false,
					code: 'UNKNOWN',
					message: ERROR_MESSAGES.UNKNOWN,
				}
			}
		},

		async update(userId, input) {
			// Validate input
			const parsed = v.safeParse(UpdateProfileSchema, input)
			if (!parsed.success) {
				const firstIssue = parsed.issues[0]
				return {
					success: false,
					code: 'VALIDATION_ERROR',
					message: firstIssue?.message ?? ERROR_MESSAGES.VALIDATION_ERROR,
				}
			}

			// Check if profile exists
			const existing = await this.getByUserId(userId)
			if (!existing) {
				return {
					success: false,
					code: 'PROFILE_NOT_FOUND',
					message: ERROR_MESSAGES.PROFILE_NOT_FOUND,
				}
			}

			const updates = parsed.output

			// Compute new displayName if first/last name changed
			const firstName = updates.firstName ?? existing.firstName
			const lastName = updates.lastName ?? existing.lastName
			const displayName = `${firstName} ${lastName}`

			try {
				const [profile] = await db
					.update(schema.profile)
					.set({
						...updates,
						displayName,
						updatedAt: new Date(),
					})
					.where(eq(schema.profile.userId, userId))
					.returning()

				if (!profile) {
					return {
						success: false,
						code: 'UNKNOWN',
						message: ERROR_MESSAGES.UNKNOWN,
					}
				}

				return { success: true, data: profile }
			}
			catch {
				return {
					success: false,
					code: 'UNKNOWN',
					message: ERROR_MESSAGES.UNKNOWN,
				}
			}
		},

		async isOnboardingComplete(userId) {
			const profile = await this.getByUserId(userId)
			return profile?.onboardingComplete ?? false
		},
	}
}
