/**
 * Validates a redirect URL to prevent open redirect attacks.
 * Only allows relative paths starting with '/'.
 *
 * @param url - The URL to validate
 * @param fallback - Fallback if invalid (default: '/dashboard')
 * @returns Safe redirect path
 */
export function safeRedirect(url: string | null | undefined, fallback = '/dashboard'): string {
	if (!url || url === '') return fallback

	// Must start with / (relative path)
	if (!url.startsWith('/')) return fallback

	// Block protocol-relative URLs (//evil.com)
	if (url.startsWith('//')) return fallback

	// Block URLs with encoded characters that could bypass checks
	// e.g., /\x2f\x2fevil.com or /%2f%2fevil.com
	if (url.includes('\\') || url.toLowerCase().includes('%2f%2f')) return fallback

	return url
}
