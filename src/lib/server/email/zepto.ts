import {
	emails,
	type PasswordResetEmailProps,
	type VerificationEmailProps,
} from '$lib/emails'

import type { EmailService } from './types'

interface ZeptoConfig {
	token: string
	from: string
	fromName?: string | undefined
}

/**
 * ZeptoMail email service for production.
 * Uses native fetch for Cloudflare Workers compatibility.
 */
export class ZeptoMailService implements EmailService {
	private readonly apiUrl = 'https://api.zeptomail.ca/v1.1/email'
	private readonly config: ZeptoConfig

	constructor(config: ZeptoConfig) {
		this.config = config
	}

	async sendVerificationEmail(params: {
		to: string
		name: string
		verificationUrl: string
	}): Promise<void> {
		const props: VerificationEmailProps = {
			name: params.name,
			verificationUrl: params.verificationUrl,
		}

		await this.send({
			to: params.to,
			toName: params.name,
			subject: emails.verification.subject(props),
			html: await emails.verification.render(props),
		})
	}

	async sendPasswordResetEmail(params: {
		to: string
		name: string
		resetUrl: string
	}): Promise<void> {
		const props: PasswordResetEmailProps = {
			name: params.name,
			resetUrl: params.resetUrl,
		}

		await this.send({
			to: params.to,
			toName: params.name,
			subject: emails.passwordReset.subject(),
			html: await emails.passwordReset.render(props),
		})
	}

	private async send(params: {
		to: string
		toName: string
		subject: string
		html: string
	}): Promise<void> {
		const response = await fetch(this.apiUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': this.config.token,
			},
			body: JSON.stringify({
				from: {
					address: this.config.from,
					name: this.config.fromName ?? 'Flock',
				},
				to: [
					{
						email_address: {
							address: params.to,
							name: params.toName,
						},
					},
				],
				subject: params.subject,
				htmlbody: params.html,
			}),
		})

		if (!response.ok) {
			const error = await response.text()
			console.error('ZeptoMail error:', error)
			throw new Error(`Failed to send email: ${response.status}`)
		}
	}
}
