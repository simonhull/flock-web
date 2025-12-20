import { createAuth } from '$lib/server/auth'
import type { RequestHandler } from './$types'

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
