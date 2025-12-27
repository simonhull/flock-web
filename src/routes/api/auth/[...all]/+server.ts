import type { RequestHandler } from './$types'
import { createAuth } from '$lib/server/auth'
import { createEmailService } from '$lib/server/email'

const handleAuth: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return new Response('Database not available', { status: 500 })
	}

	const emailService = createEmailService({
		provider: (platform.env.EMAIL_PROVIDER as 'console' | 'zepto') ?? 'console',
		zepto: {
			token: platform.env.ZEPTO_MAIL_TOKEN ?? '',
			from: platform.env.ZEPTO_MAIL_FROM ?? 'noreply@myflock.app',
			fromName: platform.env.ZEPTO_MAIL_FROM_NAME ?? 'Flock',
		},
	})

	// Use AUTH_BASE_URL if set, otherwise use request origin
	// AUTH_BASE_URL is useful for dev when testing from other devices
	const baseURL = platform.env.AUTH_BASE_URL || new URL(request.url).origin

	const auth = createAuth(platform.env.DB, {
		baseURL,
		emailService,
	})

	return auth.handler(request)
}

export const GET = handleAuth
export const POST = handleAuth
