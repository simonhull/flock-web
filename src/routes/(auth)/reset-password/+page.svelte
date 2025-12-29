<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { auth } from '$lib/auth/client'
	import { AuthLayout } from '$lib/components/auth'
	import { Alert, AlertDescription, Button, FormField, Link } from '$lib/components/ui'
	import { faSpinner, faCircleCheck, faCircleXmark } from '@fortawesome/pro-regular-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome'
	import * as v from 'valibot'

	type Status = 'form' | 'loading' | 'success' | 'error' | 'no-token'

	let status = $state<Status>('form')
	let password = $state('')
	let confirmPassword = $state('')
	let errors = $state<Record<string, string>>({})
	let serverError = $state('')

	const token = $derived(page.url.searchParams.get('token'))

	// Redirect to no-token state if no token
	$effect(() => {
		if (!token) {
			status = 'no-token'
		}
	})

	const ResetPasswordSchema = v.pipe(
		v.object({
			password: v.pipe(
				v.string('Password is required'),
				v.minLength(8, 'Password must be at least 8 characters'),
				v.maxLength(128, 'Password is too long'),
			),
			confirmPassword: v.string('Please confirm your password'),
		}),
		v.forward(
			v.check(
				input => input.password === input.confirmPassword,
				'Passwords do not match',
			),
			['confirmPassword'],
		),
	)

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault()
		errors = {}
		serverError = ''

		if (!token) {
			serverError = 'Invalid reset link. Please request a new one.'
			return
		}

		const result = v.safeParse(ResetPasswordSchema, { password, confirmPassword })

		if (!result.success) {
			for (const issue of result.issues) {
				const path = issue.path?.[0]?.key
				if (path && typeof path === 'string') {
					errors[path] = issue.message
				}
			}
			return
		}

		status = 'loading'

		try {
			const response = await auth.resetPassword({
				newPassword: result.output.password,
				token,
			})

			if (response.error) {
				status = 'error'
				serverError = response.error.message ?? 'Failed to reset password'
				return
			}

			status = 'success'

			// Redirect to login after delay
			setTimeout(() => goto('/login'), 2000)
		}
		catch (err) {
			status = 'error'
			serverError = err instanceof Error ? err.message : 'Something went wrong'
		}
	}
</script>

<svelte:head>
	<title>Reset Password | Flock</title>
</svelte:head>

{#if status === 'no-token'}
	<AuthLayout title="Invalid Reset Link" subtitle="This password reset link is invalid or has expired">
		<div class="flex flex-col items-center gap-4 py-8">
			<FontAwesomeIcon icon={faCircleXmark} class="size-16 text-destructive" />
			<p class="text-center text-muted-foreground">
				Please request a new password reset link.
			</p>
			<Button href="/forgot-password" variant="outline">
				Request new link
			</Button>
		</div>

		{#snippet footer()}
			<Link href="/login">Back to login</Link>
		{/snippet}
	</AuthLayout>
{:else if status === 'success'}
	<AuthLayout title="Password Reset!" subtitle="Your password has been successfully reset">
		<div class="flex flex-col items-center gap-4 py-8">
			<FontAwesomeIcon icon={faCircleCheck} class="size-16 text-green-500" />
			<p class="text-muted-foreground">Redirecting to login...</p>
		</div>
	</AuthLayout>
{:else if status === 'error'}
	<AuthLayout title="Reset Failed" subtitle="We couldn't reset your password">
		<div class="flex flex-col items-center gap-4 py-8">
			<FontAwesomeIcon icon={faCircleXmark} class="size-16 text-destructive" />
			<Alert variant="destructive">
				<AlertDescription>{serverError}</AlertDescription>
			</Alert>
			<Button href="/forgot-password" variant="outline">
				Request new link
			</Button>
		</div>

		{#snippet footer()}
			<Link href="/login">Back to login</Link>
		{/snippet}
	</AuthLayout>
{:else if status === 'loading'}
	<AuthLayout title="Resetting..." subtitle="Please wait while we reset your password">
		<div class="flex justify-center py-8">
			<FontAwesomeIcon icon={faSpinner} class="size-12 animate-spin text-primary" />
		</div>
	</AuthLayout>
{:else}
	<AuthLayout
		title="Reset your password"
		subtitle="Enter your new password below"
	>
		<form onsubmit={handleSubmit} class="mt-8 space-y-6">
			{#if serverError}
				<Alert variant="destructive">
					<AlertDescription>{serverError}</AlertDescription>
				</Alert>
			{/if}

			<div class="space-y-4">
				<div>
					<label for="password" class="block text-sm font-medium text-foreground">
						New password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						autocomplete="new-password"
						bind:value={password}
						class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						class:border-destructive={errors['password']}
						required
					/>
					{#if errors['password']}
						<p class="mt-1 text-sm text-destructive">{errors['password']}</p>
					{/if}
					<p class="mt-1 text-xs text-muted-foreground">At least 8 characters</p>
				</div>

				<div>
					<label for="confirmPassword" class="block text-sm font-medium text-foreground">
						Confirm new password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						autocomplete="new-password"
						bind:value={confirmPassword}
						class="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
						class:border-destructive={errors['confirmPassword']}
						required
					/>
					{#if errors['confirmPassword']}
						<p class="mt-1 text-sm text-destructive">{errors['confirmPassword']}</p>
					{/if}
				</div>
			</div>

			<Button type="submit" class="w-full">
				Reset password
			</Button>
		</form>

		{#snippet footer()}
			<Link href="/login">Back to login</Link>
		{/snippet}
	</AuthLayout>
{/if}
