import { error, json } from '@sveltejs/kit'

import { createEmailService } from '$lib/server/email'
import { createAuthService } from '$lib/server/services/auth.service'
import { createProfileService, type CreateProfileInput, type UpdateProfileInput } from '$lib/server/services/profile.service'

import type { RequestHandler } from './$types'

/**
 * GET /api/v1/profile
 * Get the current user's profile
 */
export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		error(401, 'Unauthorized')
	}

	if (!platform?.env?.DB) {
		error(500, 'Database not available')
	}

	const profileService = createProfileService(platform.env.DB)
	const profile = await profileService.getByUserId(locals.user.id)

	return json({ data: profile })
}

/**
 * POST /api/v1/profile
 * Create a new profile (onboarding)
 */
export const POST: RequestHandler = async ({ locals, platform, request, url }) => {
	if (!locals.user) {
		error(401, 'Unauthorized')
	}

	if (!platform?.env?.DB) {
		error(500, 'Database not available')
	}

	// Service validates with Valibot - let it handle missing/invalid fields
	const body = (await request.json()) as CreateProfileInput

	const profileService = createProfileService(platform.env.DB)
	const result = await profileService.create(locals.user.id, body)

	if (!result.success) {
		error(400, result.message)
	}

	// Update the user's name in BetterAuth so future emails use the real name
	const displayName = `${body.firstName} ${body.lastName}`.trim()
	const emailService = createEmailService({
		provider: (platform.env.EMAIL_PROVIDER as 'console' | 'zepto') ?? 'console',
		zepto: {
			token: platform.env.ZEPTO_MAIL_TOKEN ?? '',
			from: platform.env.ZEPTO_MAIL_FROM ?? 'noreply@myflock.app',
			fromName: platform.env.ZEPTO_MAIL_FROM_NAME ?? 'Flock',
		},
	})
	const authService = createAuthService(platform.env.DB, url.origin, emailService)
	await authService.updateUserName(displayName, request.headers)

	return json({ data: result.data }, { status: 201 })
}

/**
 * PATCH /api/v1/profile
 * Update the current user's profile
 */
export const PATCH: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) {
		error(401, 'Unauthorized')
	}

	if (!platform?.env?.DB) {
		error(500, 'Database not available')
	}

	// Service validates with Valibot - let it handle invalid fields
	const body = (await request.json()) as UpdateProfileInput

	const profileService = createProfileService(platform.env.DB)
	const result = await profileService.update(locals.user.id, body)

	if (!result.success) {
		if (result.code === 'PROFILE_NOT_FOUND') {
			error(404, result.message)
		}
		error(400, result.message)
	}

	return json({ data: result.data })
}
