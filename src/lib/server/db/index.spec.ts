import { describe, expect, it, vi } from 'vitest'
import { createDb } from './index'

describe('createDb', () => {
	it('creates a drizzle instance from D1Database', () => {
		const mockD1 = {
			prepare: vi.fn(),
			batch: vi.fn(),
			exec: vi.fn(),
			dump: vi.fn(),
		} as unknown as D1Database

		const db = createDb(mockD1)

		expect(db).toBeDefined()
		expect(db.select).toBeDefined()
		expect(db.insert).toBeDefined()
		expect(db.update).toBeDefined()
		expect(db.delete).toBeDefined()
	})
})
