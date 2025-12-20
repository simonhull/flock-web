import { json } from '@sveltejs/kit'
import { createDb } from '$lib/server/db'
import { user } from '$lib/server/db/schema'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Database not available' }, { status: 500 })
	}

	const db = createDb(platform.env.DB)

	// Simple query to verify connection
	const users = await db.select().from(user).limit(1)

	return json({
		status: 'ok',
		database: 'connected',
		userCount: users.length,
	})
}
