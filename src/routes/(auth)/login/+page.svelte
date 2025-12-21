<script lang="ts">
	import { login } from '$lib/auth.remote'
	import { AuthLayout } from '$lib/components/auth'
	import { Button, Input, Label, Link, Alert, AlertDescription } from '$lib/components/ui'
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
			<div class="space-y-2">
				<Label for="email">Email address</Label>
				<Input
					{...login.fields.email.as('email')}
					id="email"
					aria-invalid={(login.fields.email.issues() ?? []).length > 0}
					autocomplete="email"
					required
				/>
				{#each login.fields.email.issues() ?? [] as issue}
					<p class="text-sm text-destructive">{issue.message}</p>
				{/each}
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					{...login.fields._password.as('password')}
					id="password"
					aria-invalid={(login.fields._password.issues() ?? []).length > 0}
					autocomplete="current-password"
					required
				/>
				{#each login.fields._password.issues() ?? [] as issue}
					<p class="text-sm text-destructive">{issue.message}</p>
				{/each}
			</div>
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
