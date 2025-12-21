<script lang="ts">
	import { login } from '$lib/auth.remote'
	import { AuthLayout } from '$lib/components/auth'
	import { Button, FormField, Link } from '$lib/components/ui'
	import LoaderCircle from 'lucide-svelte/icons/loader-circle'
</script>

<svelte:head>
	<title>Sign In | Flock</title>
</svelte:head>

<AuthLayout
	title="Welcome back"
	subtitle="Sign in to connect with your communities"
>
	<form {...login} class="mt-8 space-y-6">

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
				<LoaderCircle class="animate-spin" />
				Signing in...
			{:else}
				Sign in
			{/if}
		</Button>
	</form>

	{#snippet footer()}
		Don't have an account? <Link href="/register">Create one</Link>
	{/snippet}
</AuthLayout>
