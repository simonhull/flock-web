import { expect, test } from '@playwright/test'

test.describe('Health API', () => {
	test('GET /api/health returns database status', async ({ request }) => {
		const response = await request.get('/api/health')

		expect(response.ok()).toBe(true)
		expect(response.status()).toBe(200)

		const body = await response.json()

		expect(body).toMatchObject({
			status: 'ok',
			database: 'connected',
		})
		expect(typeof body.userCount).toBe('number')
	})

	test('health endpoint responds quickly', async ({ request }) => {
		const start = Date.now()
		const response = await request.get('/api/health')
		const duration = Date.now() - start

		expect(response.ok()).toBe(true)
		expect(duration).toBeLessThan(1000)
	})
})
