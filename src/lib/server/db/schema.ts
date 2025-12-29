import { relations } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

// ============================================================================
// HELPERS
// ============================================================================

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())

const timestamps = {
	createdAt: integer('created_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
	updatedAt: integer('updated_at', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date()),
}

// ============================================================================
// USER - BetterAuth core table
// ============================================================================

/**
 * Authentication identity. Managed by BetterAuth.
 * Contains the minimum needed for auth - profile data lives in profiles table.
 */
export const user = sqliteTable('user', {
	id: id(),
	name: text('name').notNull(),
	email: text('email').notNull(),
	emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
	image: text('image'),
	...timestamps,
}, table => [
	uniqueIndex('user_email_idx').on(table.email),
])

// ============================================================================
// SESSION - BetterAuth core table
// ============================================================================

/**
 * Active login sessions. Managed by BetterAuth.
 */
export const session = sqliteTable('session', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	token: text('token').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	ipAddress: text('ip_address'),
	userAgent: text('user_agent'),
	...timestamps,
}, table => [
	uniqueIndex('session_token_idx').on(table.token),
	index('session_user_id_idx').on(table.userId),
])

// ============================================================================
// ACCOUNT - BetterAuth core table
// ============================================================================

/**
 * OAuth provider links and credential accounts. Managed by BetterAuth.
 * Password field is used for email/password auth.
 */
export const account = sqliteTable('account', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),
	accountId: text('account_id').notNull(),
	providerId: text('provider_id').notNull(),
	accessToken: text('access_token'),
	refreshToken: text('refresh_token'),
	accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
	scope: text('scope'),
	idToken: text('id_token'),
	password: text('password'),
	...timestamps,
}, table => [
	index('account_user_id_idx').on(table.userId),
])

// ============================================================================
// VERIFICATION - BetterAuth core table
// ============================================================================

/**
 * Email verification and password reset tokens. Managed by BetterAuth.
 */
export const verification = sqliteTable('verification', {
	id: id(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
	...timestamps,
})

// ============================================================================
// ADDRESS - Reusable for profiles, churches, events
// ============================================================================

/**
 * Physical addresses. Reusable across entities.
 * Profiles, churches, and events can all reference addresses.
 */
export const address = sqliteTable('address', {
	id: id(),
	line1: text('line1'),
	line2: text('line2'),
	city: text('city'),
	state: text('state'),
	postalCode: text('postal_code'),
	country: text('country'),
	...timestamps,
})

// ============================================================================
// PROFILE - The portable identity (Flock-specific)
// ============================================================================

/**
 * Gender options for profile.
 */
export const genderEnum = ['male', 'female', 'prefer_not_to_say'] as const
export type Gender = (typeof genderEnum)[number]

/**
 * Marital status options for profile.
 */
export const maritalStatusEnum = ['single', 'married', 'divorced', 'widowed', 'prefer_not_to_say'] as const
export type MaritalStatus = (typeof maritalStatusEnum)[number]

/**
 * THIS IS THE SOUL OF FLOCK.
 *
 * The profile is what travels with you. It's not "user settings" —
 * it's WHO YOU ARE across all communities. One user, one profile.
 *
 * Separated from the user table because:
 * 1. BetterAuth manages user for auth - we don't touch it
 * 2. Profile is the thing that moves between churches
 * 3. Clear separation of concerns: auth vs identity
 */
export const profile = sqliteTable('profile', {
	id: id(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id, { onDelete: 'cascade' }),

	// Required (onboarding)
	firstName: text('first_name').notNull(),
	lastName: text('last_name').notNull(),
	birthday: text('birthday').notNull(), // ISO date 'YYYY-MM-DD'
	gender: text('gender', { enum: genderEnum }).notNull(),

	// Computed/synced
	displayName: text('display_name').notNull(),

	// Optional (profile settings)
	phoneNumber: text('phone_number'),
	avatarUrl: text('avatar_url'),
	bio: text('bio'),
	maritalStatus: text('marital_status', { enum: maritalStatusEnum }),
	anniversary: text('anniversary'), // ISO date

	// Address reference
	addressId: text('address_id').references(() => address.id, { onDelete: 'set null' }),

	// System
	onboardingComplete: integer('onboarding_complete', { mode: 'boolean' }).notNull().default(false),

	...timestamps,
}, table => [
	uniqueIndex('profile_user_id_idx').on(table.userId),
])

// ============================================================================
// RELATIONS - For Drizzle query builder
// ============================================================================

export const userRelations = relations(user, ({ one, many }) => ({
	profile: one(profile, {
		fields: [user.id],
		references: [profile.userId],
	}),
	sessions: many(session),
	accounts: many(account),
}))

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id],
	}),
}))

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id],
	}),
}))

export const profileRelations = relations(profile, ({ one }) => ({
	user: one(user, {
		fields: [profile.userId],
		references: [user.id],
	}),
	address: one(address, {
		fields: [profile.addressId],
		references: [address.id],
	}),
}))

export const addressRelations = relations(address, ({ many }) => ({
	profiles: many(profile),
}))

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type User = typeof user.$inferSelect
export type NewUser = typeof user.$inferInsert

export type Session = typeof session.$inferSelect
export type NewSession = typeof session.$inferInsert

export type Account = typeof account.$inferSelect
export type NewAccount = typeof account.$inferInsert

export type Verification = typeof verification.$inferSelect
export type NewVerification = typeof verification.$inferInsert

export type Profile = typeof profile.$inferSelect
export type NewProfile = typeof profile.$inferInsert

export type Address = typeof address.$inferSelect
export type NewAddress = typeof address.$inferInsert
