/// <reference types="@cloudflare/workers-types" />

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: {
				id: string
				email: string
				name: string
				emailVerified: boolean
				image?: string | null | undefined
				createdAt: Date
				updatedAt: Date
			} | null
			session: {
				id: string
				userId: string
				expiresAt: Date
				createdAt: Date
				updatedAt: Date
				token: string
			} | null
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database
				EMAIL_PROVIDER?: string
				ZEPTO_MAIL_TOKEN?: string
				ZEPTO_MAIL_FROM?: string
				ZEPTO_MAIL_FROM_NAME?: string
			}
			context: ExecutionContext
			caches: CacheStorage
		}
	}
}

export {}
