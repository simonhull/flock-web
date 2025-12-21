import type { RequestHandler } from './$types'
import { createAuth } from '$lib/server/auth'

const handleAuth: RequestHandler = async ({ request, platform }) => {
	if (!platform?.env?.DB) {
		return new Response('Database not available', { status: 500 })
	}

	const auth = createAuth(platform.env.DB, {
		baseURL: new URL(request.url).origin,
	})

	return auth.handler(request)
}

export const GET = handleAuth
export const POST = handleAuth
