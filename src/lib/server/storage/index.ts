// ============================================================================
// Storage Service
// ============================================================================
//
// Handles file uploads to R2. For avatars and other user uploads.
//
// Architecture:
// - Client uploads file to our API endpoint
// - Worker saves to R2 using the bucket binding
// - Returns a public URL for the stored file
//
// Note: We use direct upload through the Worker rather than presigned URLs
// because it's simpler and avatars are small (<5MB typically).

export interface StorageService {
	/**
	 * Upload a file to storage.
	 * @param folder - The folder/prefix for the file (e.g., 'avatars')
	 * @param userId - The user ID (used for namespacing)
	 * @param file - The file data as ArrayBuffer or ReadableStream
	 * @param contentType - MIME type of the file
	 * @returns The public URL of the uploaded file
	 */
	upload(
		folder: string,
		userId: string,
		file: ArrayBuffer | ReadableStream,
		contentType: string,
	): Promise<string>

	/**
	 * Delete a file from storage.
	 * @param key - The full key/path of the file to delete
	 */
	delete(key: string): Promise<void>

	/**
	 * Get the public URL for a stored file.
	 * @param key - The full key/path of the file
	 */
	getPublicUrl(key: string): string
}

export interface StorageConfig {
	bucket: R2Bucket
	/** Base URL for public access (e.g., 'https://pub-xxx.r2.dev' or 'https://cdn.myflock.app') */
	publicUrlBase: string
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Generate a unique file key.
 * Format: {folder}/{userId}/{timestamp}-{random}.{ext}
 */
function generateKey(folder: string, userId: string, contentType: string): string {
	const ext = contentType.split('/')[1] || 'bin'
	const timestamp = Date.now()
	const random = Math.random().toString(36).substring(2, 10)
	return `${folder}/${userId}/${timestamp}-${random}.${ext}`
}

/**
 * Extract the key from a full URL.
 */
export function extractKeyFromUrl(url: string, publicUrlBase: string): string | null {
	if (!url.startsWith(publicUrlBase)) {
		return null
	}
	return url.slice(publicUrlBase.length + 1) // +1 for the slash
}

// ============================================================================
// Service Factory
// ============================================================================

export function createStorageService(config: StorageConfig): StorageService {
	const { bucket, publicUrlBase } = config

	return {
		async upload(folder, userId, file, contentType) {
			const key = generateKey(folder, userId, contentType)

			await bucket.put(key, file, {
				httpMetadata: {
					contentType,
				},
			})

			return this.getPublicUrl(key)
		},

		async delete(key) {
			await bucket.delete(key)
		},

		getPublicUrl(key) {
			// Remove leading slash if present
			const cleanKey = key.startsWith('/') ? key.slice(1) : key
			return `${publicUrlBase}/${cleanKey}`
		},
	}
}

// ============================================================================
// Constants
// ============================================================================

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const
export const MAX_AVATAR_SIZE = 5 * 1024 * 1024 // 5MB
