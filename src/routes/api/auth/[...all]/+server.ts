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

	const auth = createAuth(platform.env.DB, {
		baseURL: new URL(request.url).origin,
		emailService,
	})

	return auth.handler(request)
}

export const GET = handleAuth
export const POST = handleAuth
