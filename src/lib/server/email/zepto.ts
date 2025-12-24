import Renderer from 'better-svelte-email/render'

import VerificationEmail from '$lib/emails/verification.svelte'

import type { EmailService } from './types'

interface ZeptoConfig {
	token: string
	from: string
	fromName?: string | undefined
}

/**
 * Zepto Mail email service for production.
 * Uses native fetch for Cloudflare Workers compatibility.
 */
export class ZeptoMailService implements EmailService {
	private readonly apiUrl = 'https://api.zeptomail.ca/v1.1/email'
	private readonly config: ZeptoConfig
	private readonly renderer: { render: InstanceType<typeof Renderer>['render'] }

	constructor(config: ZeptoConfig) {
		this.config = config
		const rendererInstance = new Renderer()
		this.renderer = { render: rendererInstance.render.bind(rendererInstance) }
	}

	async sendVerificationEmail(params: {
		to: string
		name: string
		verificationUrl: string
	}): Promise<void> {
		const html = await this.renderer.render(VerificationEmail, {
			props: {
				name: params.name,
				verificationUrl: params.verificationUrl,
			},
		})

		await this.send({
			to: params.to,
			toName: params.name,
			subject: 'Verify your Flock account',
			html,
		})
	}

	async sendPasswordResetEmail(params: {
		to: string
		name: string
		resetUrl: string
	}): Promise<void> {
		// TODO: Create password reset template in TASK-001g
		// For now, send a simple HTML email
		const html = `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
				<h1>Reset Your Password</h1>
				<p>Hi ${params.name},</p>
				<p>Click the link below to reset your password:</p>
				<p><a href="${params.resetUrl}">${params.resetUrl}</a></p>
				<p>If you didn't request this, you can safely ignore this email.</p>
			</div>
		`

		await this.send({
			to: params.to,
			toName: params.name,
			subject: 'Reset your Flock password',
			html,
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
			console.error('Zepto Mail error:', error)
			throw new Error(`Failed to send email: ${response.status}`)
		}
	}
}
