<script lang="ts">
	import { page } from '$app/state'
	import { login } from '$lib/auth.remote'
	import { AuthLayout } from '$lib/components/auth'
	import { Alert, AlertDescription, Button, FormField, Link } from '$lib/components/ui'
	import { faCircleCheck, faSpinner } from '@fortawesome/pro-regular-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome'

	const redirectTo = $derived(page.url.searchParams.get('redirectTo') ?? '')
	const verified = $derived(page.url.searchParams.get('verified') === 'true')
</script>

<svelte:head>
	<title>Sign In | Flock</title>
</svelte:head>

<AuthLayout
	title="Welcome back"
	subtitle="Sign in to connect with your communities"
>
	<form {...login} class="mt-8 space-y-6">
		<input type="hidden" name="_redirectTo" value={redirectTo} />

		{#if verified}
			<Alert class="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
				<FontAwesomeIcon icon={faCircleCheck} class="size-4 text-green-600 dark:text-green-400" />
				<AlertDescription class="text-green-800 dark:text-green-200">
					Email verified! You can now sign in.
				</AlertDescription>
			</Alert>
		{/if}

		<div class="space-y-4">
			<FormField
				field={login.fields.email}
				label="Email address"
				type="email"
				id="email"
				autocomplete="email"
				required
			/>

			<FormField
				field={login.fields._password}
				label="Password"
				type="password"
				id="password"
				autocomplete="current-password"
				required
			/>
		</div>

		<Button type="submit" class="w-full" disabled={!!login.pending}>
			{#if login.pending}
				<FontAwesomeIcon icon={faSpinner} class="animate-spin" />
				Signing in...
			{:else}
				Sign in
			{/if}
		</Button>
	</form>

	{#snippet footer()}
		<Link href="/forgot-password">Forgot your password?</Link>
		<span class="mx-2">&middot;</span>
		Don't have an account? <Link href="/register">Create one</Link>
	{/snippet}
</AuthLayout>
