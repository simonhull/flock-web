<script lang="ts">
	import { Button, Hr, Text } from 'better-svelte-email'
	import EmailLayout from './EmailLayout.svelte'

	interface Props {
		name: string
		resetUrl: string
	}

	let { name, resetUrl }: Props = $props()
</script>

<EmailLayout preview="Reset your Flock password">
	<Text style="color: #1f2937; font-size: 20px; font-weight: 600; margin: 0 0 16px 0;">
		Reset your password
	</Text>

	<Text style="color: #4b5563; font-size: 16px; line-height: 24px; margin: 0 0 24px 0;">
		Hi {name}, we received a request to reset your password. Click the button below to choose a new one.
	</Text>

	<Button
		href={resetUrl}
		style="background-color: #009DD1; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 14px; font-weight: 500; padding: 12px 24px; text-decoration: none;"
	>
		Reset Password
	</Button>

	<Hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />

	<Text style="color: #9ca3af; font-size: 14px; margin: 0 0 8px 0;">
		Didn't request this? You can safely ignore this email. Your password won't change.
	</Text>

	<Text style="color: #d1d5db; font-size: 12px; margin: 0; word-break: break-all;">
		{resetUrl}
	</Text>
</EmailLayout>
