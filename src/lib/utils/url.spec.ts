import { describe, expect, it } from 'vitest'

import { safeRedirect } from './url'

describe('safeRedirect', () => {
	it('allows valid relative paths', () => {
		expect(safeRedirect('/dashboard')).toBe('/dashboard')
		expect(safeRedirect('/app/settings')).toBe('/app/settings')
		expect(safeRedirect('/foo?bar=baz')).toBe('/foo?bar=baz')
	})

	it('blocks absolute URLs', () => {
		expect(safeRedirect('https://evil.com')).toBe('/dashboard')
		expect(safeRedirect('http://evil.com')).toBe('/dashboard')
	})

	it('blocks protocol-relative URLs', () => {
		expect(safeRedirect('//evil.com')).toBe('/dashboard')
	})

	it('blocks encoded bypass attempts', () => {
		expect(safeRedirect('/%2f%2fevil.com')).toBe('/dashboard')
		expect(safeRedirect('/\\evil.com')).toBe('/dashboard')
	})

	it('returns fallback for empty/null', () => {
		expect(safeRedirect(null)).toBe('/dashboard')
		expect(safeRedirect(undefined)).toBe('/dashboard')
		expect(safeRedirect('')).toBe('/dashboard')
	})

	it('uses custom fallback', () => {
		expect(safeRedirect(null, '/home')).toBe('/home')
	})
})
