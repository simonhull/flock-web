import type { RequestHandler } from './$types'
import { createDb } from '$lib/server/db'
import { json } from '@sveltejs/kit'
import { sql } from 'drizzle-orm'

export const GET: RequestHandler = async ({ platform }) => {
	if (!platform?.env?.DB) {
		return json({ error: 'Database not available' }, { status: 500 })
	}

	const db = createDb(platform.env.DB)

	// Verify all tables exist by querying sqlite_master
	const tables = await db.all<{ name: string }>(
		sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%'`,
	)

	const tableNames = tables.map(t => t.name).sort()
	const expectedTables = ['account', 'profile', 'session', 'user', 'verification']
	const allTablesExist = expectedTables.every(t => tableNames.includes(t))

	return json({
		status: allTablesExist ? 'ok' : 'degraded',
		database: 'connected',
		tables: tableNames,
	})
}
