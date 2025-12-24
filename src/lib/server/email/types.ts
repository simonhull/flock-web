/**
 * Email service interface for sending transactional emails.
 * Implementations: ConsoleEmailService (dev), ZeptoMailService (production)
 */
export interface EmailService {
	/**
	 * Send email verification link to user
	 */
	sendVerificationEmail(params: {
		to: string
		name: string
		verificationUrl: string
	}): Promise<void>

	/**
	 * Send password reset link to user
	 */
	sendPasswordResetEmail(params: {
		to: string
		name: string
		resetUrl: string
	}): Promise<void>
}

/**
 * Configuration for email service factory
 */
export interface EmailConfig {
	provider: 'console' | 'zepto'
	zepto?: {
		token: string
		from: string
		fromName?: string
	}
}
