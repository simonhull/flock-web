import { error, json } from '@sveltejs/kit'

import {
	ALLOWED_IMAGE_TYPES,
	createStorageService,
	extractKeyFromUrl,
	MAX_AVATAR_SIZE,
} from '$lib/server/storage'
import { createProfileService } from '$lib/server/services/profile.service'

import type { RequestHandler } from './$types'

// Default public URL base for R2 (can be overridden via environment)
const DEFAULT_PUBLIC_URL_BASE = 'https://pub-flock.r2.dev'

/**
 * POST /api/v1/profile/avatar
 * Upload a new avatar image
 */
export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) {
		error(401, 'Unauthorized')
	}

	if (!platform?.env?.STORAGE) {
		error(500, 'Storage not available')
	}

	const formData = await request.formData()
	const file = formData.get('file')

	if (!file || !(file instanceof File)) {
		error(400, 'No file provided')
	}

	// Validate file type
	if (!ALLOWED_IMAGE_TYPES.includes(file.type as typeof ALLOWED_IMAGE_TYPES[number])) {
		error(400, `Invalid file type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`)
	}

	// Validate file size
	if (file.size > MAX_AVATAR_SIZE) {
		const maxMB = Math.round(MAX_AVATAR_SIZE / 1024 / 1024)
		error(400, `File too large. Maximum size: ${maxMB}MB`)
	}

	const publicUrlBase = platform.env.STORAGE_PUBLIC_URL ?? DEFAULT_PUBLIC_URL_BASE
	const storageService = createStorageService({
		bucket: platform.env.STORAGE,
		publicUrlBase,
	})

	// Delete old avatar if it exists
	if (platform.env.DB) {
		const profileService = createProfileService(platform.env.DB)
		const profile = await profileService.getByUserId(locals.user.id)

		if (profile?.avatarUrl) {
			const oldKey = extractKeyFromUrl(profile.avatarUrl, publicUrlBase)
			if (oldKey) {
				try {
					await storageService.delete(oldKey)
				} catch {
					// Ignore deletion errors
				}
			}
		}
	}

	// Upload new avatar
	const arrayBuffer = await file.arrayBuffer()
	const url = await storageService.upload('avatars', locals.user.id, arrayBuffer, file.type)

	return json({ data: { url } }, { status: 201 })
}

/**
 * DELETE /api/v1/profile/avatar
 * Remove the current user's avatar
 */
export const DELETE: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) {
		error(401, 'Unauthorized')
	}

	if (!platform?.env?.STORAGE || !platform?.env?.DB) {
		error(500, 'Storage or database not available')
	}

	const publicUrlBase = platform.env.STORAGE_PUBLIC_URL ?? DEFAULT_PUBLIC_URL_BASE
	const storageService = createStorageService({
		bucket: platform.env.STORAGE,
		publicUrlBase,
	})

	const profileService = createProfileService(platform.env.DB)
	const profile = await profileService.getByUserId(locals.user.id)

	if (!profile?.avatarUrl) {
		error(404, 'No avatar to delete')
	}

	// Delete from storage
	const key = extractKeyFromUrl(profile.avatarUrl, publicUrlBase)
	if (key) {
		await storageService.delete(key)
	}

	// Update profile to remove avatar URL
	await profileService.update(locals.user.id, { avatarUrl: null })

	return json({ success: true })
}
