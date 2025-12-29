<script lang="ts">
	import { register } from '$lib/auth.remote'
	import { AuthLayout } from '$lib/components/auth'
	import { Alert, AlertDescription, Button, FormField, Link } from '$lib/components/ui'
	import { faSpinner } from '@fortawesome/pro-regular-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome'
</script>

<svelte:head>
	<title>Create Account | Flock</title>
</svelte:head>

<AuthLayout
	title="Create your account"
	subtitle="Your identity. Your communities. Your journey."
>
	<form {...register} class="mt-8 space-y-6">
		{#each (register.fields.allIssues() ?? []).filter(i => !i.path) as issue}
			<Alert variant="destructive">
				<AlertDescription>{issue.message}</AlertDescription>
			</Alert>
		{/each}

		<div class="space-y-4">
			<FormField
				field={register.fields.email}
				label="Email address"
				type="email"
				id="email"
				autocomplete="email"
				required
			/>

			<FormField
				field={register.fields._password}
				label="Password"
				type="password"
				id="password"
				autocomplete="new-password"
				hint="At least 8 characters"
				required
			/>

			<FormField
				field={register.fields._confirmPassword}
				label="Confirm password"
				type="password"
				id="confirmPassword"
				autocomplete="new-password"
				required
			/>
		</div>

		<Button type="submit" class="w-full" disabled={!!register.pending}>
			{#if register.pending}
				<FontAwesomeIcon icon={faSpinner} class="animate-spin" />
				Creating account...
			{:else}
				Create account
			{/if}
		</Button>
	</form>

	{#snippet footer()}
		Already have an account? <Link href="/login">Sign in</Link>
	{/snippet}
</AuthLayout>
