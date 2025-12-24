import { ConsoleEmailService } from './console'
import { ZeptoMailService } from './zepto'

import type { EmailConfig, EmailService } from './types'

export type { EmailConfig, EmailService }
export { ConsoleEmailService, ZeptoMailService }

/**
 * Create an email service based on configuration.
 * Falls back to console if Zepto token is missing.
 */
export function createEmailService(config: EmailConfig): EmailService {
	// Always use console if explicitly requested
	if (config.provider === 'console') {
		return new ConsoleEmailService()
	}

	// Use Zepto if configured, otherwise fall back to console
	if (config.provider === 'zepto' && config.zepto?.token) {
		return new ZeptoMailService({
			token: config.zepto.token,
			from: config.zepto.from,
			fromName: config.zepto.fromName,
		})
	}

	// Fallback: missing Zepto config, use console with warning
	console.warn('Zepto Mail not configured, falling back to console email service')
	return new ConsoleEmailService()
}
