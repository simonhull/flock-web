import Renderer from 'better-svelte-email/render'

import PasswordResetEmail from './password-reset.svelte'
import VerificationEmail from './verification.svelte'

// ============================================================================
// Types
// ============================================================================

export interface VerificationEmailProps {
	name: string
	verificationUrl: string
}

export interface PasswordResetEmailProps {
	name: string
	resetUrl: string
}

// ============================================================================
// Renderer (lazy singleton)
// ============================================================================

let renderer: Renderer | null = null
const getRenderer = () => (renderer ??= new Renderer())

// ============================================================================
// Email Registry
//
// Single source of truth: subject lives with its template.
// Adding a new email = create component + add entry here.
// ============================================================================

export const emails = {
	verification: {
		subject: ({ name }: VerificationEmailProps) => `Welcome to Flock, ${name}`,
		render: (props: VerificationEmailProps) => getRenderer().render(VerificationEmail, { props }),
	},

	passwordReset: {
		subject: () => 'Reset your Flock password',
		render: (props: PasswordResetEmailProps) => getRenderer().render(PasswordResetEmail, { props }),
	},
} as const

export type EmailType = keyof typeof emails
