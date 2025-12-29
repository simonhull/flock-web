import { redirect } from '@sveltejs/kit'

import { createProfileService } from '$lib/server/services/profile.service'

import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals, platform }) => {
	// User should already be authenticated (handled by hooks)
	if (!locals.user) {
		redirect(303, '/login')
	}

	// If already onboarded, redirect to dashboard
	if (platform?.env?.DB) {
		const profileService = createProfileService(platform.env.DB)
		const isComplete = await profileService.isOnboardingComplete(locals.user.id)

		if (isComplete) {
			redirect(303, '/dashboard')
		}
	}

	return {
		user: locals.user,
	}
}
