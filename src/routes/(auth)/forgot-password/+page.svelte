<script lang="ts">
	import { page } from '$app/state'
	import { forgotPassword } from '$lib/auth.remote'
	import { AuthLayout } from '$lib/components/auth'
	import { Button, FormField, Link } from '$lib/components/ui'
	import { faSpinner, faEnvelope } from '@fortawesome/pro-regular-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome'

	const sent = $derived(page.url.searchParams.get('sent') === 'true')
</script>

<svelte:head>
	<title>Forgot Password | Flock</title>
</svelte:head>

{#if sent}
	<AuthLayout title="Check Your Email" subtitle="We've sent a password reset link">
		<div class="flex flex-col items-center gap-6 py-8">
			<div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
				<FontAwesomeIcon icon={faEnvelope} class="size-8 text-primary" />
			</div>
			<p class="text-center text-muted-foreground">
				If an account exists with that email, you'll receive a reset link shortly.
				Check your spam folder if you don't see it.
			</p>
		</div>

		{#snippet footer()}
			<Link href="/login">Back to login</Link>
		{/snippet}
	</AuthLayout>
{:else}
	<AuthLayout
		title="Forgot your password?"
		subtitle="Enter your email and we'll send you a reset link"
	>
		<form {...forgotPassword} class="mt-8 space-y-6">
			<div class="space-y-4">
				<FormField
					field={forgotPassword.fields.email}
					label="Email address"
					type="email"
					id="email"
					autocomplete="email"
					required
				/>
			</div>

			<Button type="submit" class="w-full" disabled={!!forgotPassword.pending}>
				{#if forgotPassword.pending}
					<FontAwesomeIcon icon={faSpinner} class="animate-spin" />
					Sending...
				{:else}
					Send reset link
				{/if}
			</Button>
		</form>

		{#snippet footer()}
			Remember your password? <Link href="/login">Sign in</Link>
		{/snippet}
	</AuthLayout>
{/if}
