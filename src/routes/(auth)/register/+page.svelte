<script lang="ts">
	import { register } from '$lib/auth.remote'
	import { AuthLayout } from '$lib/components/auth'
	import { Button, Input, Label, Link, Alert, AlertDescription } from '$lib/components/ui'
	import LoaderCircle from 'lucide-svelte/icons/loader-circle'
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
			<div class="space-y-2">
				<Label for="email">Email address</Label>
				<Input
					{...register.fields.email.as('email')}
					id="email"
					aria-invalid={(register.fields.email.issues() ?? []).length > 0}
					autocomplete="email"
					required
				/>
				{#each register.fields.email.issues() ?? [] as issue}
					<p class="text-sm text-destructive">{issue.message}</p>
				{/each}
			</div>

			<div class="space-y-2">
				<Label for="password">Password</Label>
				<Input
					{...register.fields._password.as('password')}
					id="password"
					aria-invalid={(register.fields._password.issues() ?? []).length > 0}
					autocomplete="new-password"
					required
				/>
				<p class="text-sm text-muted-foreground">At least 8 characters</p>
				{#each register.fields._password.issues() ?? [] as issue}
					<p class="text-sm text-destructive">{issue.message}</p>
				{/each}
			</div>

			<div class="space-y-2">
				<Label for="confirmPassword">Confirm password</Label>
				<Input
					{...register.fields._confirmPassword.as('password')}
					id="confirmPassword"
					aria-invalid={(register.fields._confirmPassword.issues() ?? []).length > 0}
					autocomplete="new-password"
					required
				/>
				{#each register.fields._confirmPassword.issues() ?? [] as issue}
					<p class="text-sm text-destructive">{issue.message}</p>
				{/each}
			</div>
		</div>

		<Button type="submit" class="w-full" disabled={!!register.pending}>
			{#if register.pending}
				<LoaderCircle class="animate-spin" />
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
