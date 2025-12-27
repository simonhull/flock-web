import { emails } from '$lib/emails'

import type { EmailService } from './types'

/**
 * Console-based email service for development.
 * Logs emails to stdout instead of sending them.
 */
export class ConsoleEmailService implements EmailService {
	async sendVerificationEmail(params: {
		to: string
		name: string
		verificationUrl: string
	}): Promise<void> {
		const subject = emails.verification.subject({ name: params.name, verificationUrl: params.verificationUrl })
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('📧 VERIFICATION EMAIL')
		console.log(`   To: ${params.to}`)
		console.log(`   Subject: ${subject}`)
		console.log(`   URL: ${params.verificationUrl}`)
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	}

	async sendPasswordResetEmail(params: {
		to: string
		name: string
		resetUrl: string
	}): Promise<void> {
		const subject = emails.passwordReset.subject()
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
		console.log('🔑 PASSWORD RESET EMAIL')
		console.log(`   To: ${params.to}`)
		console.log(`   Subject: ${subject}`)
		console.log(`   URL: ${params.resetUrl}`)
		console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
	}
}
