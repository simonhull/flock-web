<script lang="ts">
	import { goto } from '$app/navigation'
	import { page } from '$app/state'
	import { auth } from '$lib/auth/client'
	import { AuthLayout } from '$lib/components/auth'
	import { Alert, AlertDescription, Button, Link } from '$lib/components/ui'
	import { faSpinner, faCircleCheck, faCircleXmark, faEnvelope } from '@fortawesome/pro-regular-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome'

	type Status = 'loading' | 'success' | 'error' | 'no-token'

	let status = $state<Status>('loading')
	let errorMessage = $state('')
	let isResending = $state(false)
	let resendSuccess = $state(false)
	let resendError = $state('')
	let userEmail = $state<string | null>(null)

	const token = $derived(page.url.searchParams.get('token'))
	const emailParam = $derived(page.url.searchParams.get('email'))

	$effect(() => {
		if (!token) {
			status = 'no-token'
			// Get email from query param (after registration) or session (if signed in)
			if (emailParam) {
				userEmail = emailParam
			} else {
				auth.getSession().then((session) => {
					if (session.data?.user?.email) {
						userEmail = session.data.user.email
					}
				})
			}
			return
		}

		verifyToken(token)
	})

	async function verifyToken(tokenValue: string) {
		try {
			const result = await auth.verifyEmail({ query: { token: tokenValue } })

			if (result.error) {
				status = 'error'
				errorMessage = result.error.message ?? 'Verification failed'
				// Try to get email from session for resend
				const session = await auth.getSession()
				if (session.data?.user?.email) {
					userEmail = session.data.user.email
				}
				return
			}

			status = 'success'
			setTimeout(() => goto('/login?verified=true'), 2000)
		}
		catch (err) {
			status = 'error'
			errorMessage = err instanceof Error ? err.message : 'Something went wrong'
		}
	}

	async function resendVerification() {
		if (!userEmail) {
			resendError = 'Please sign in to resend the verification email'
			return
		}

		isResending = true
		resendSuccess = false
		resendError = ''

		try {
			await auth.sendVerificationEmail({
				email: userEmail,
				callbackURL: '/dashboard',
			})
			resendSuccess = true
			setTimeout(() => (resendSuccess = false), 5000)
		}
		catch (err) {
			console.error('Failed to resend:', err)
			resendError = 'Failed to send verification email. Please try again.'
		}
		finally {
			isResending = false
		}
	}
</script>

<svelte:head>
	<title>Verify Email | Flock</title>
</svelte:head>

{#if status === 'loading'}
	<AuthLayout title="Verifying..." subtitle="Please wait while we verify your email">
		<div class="flex justify-center py-8">
			<FontAwesomeIcon icon={faSpinner} class="size-12 animate-spin text-primary" />
		</div>
	</AuthLayout>
{:else if status === 'success'}
	<AuthLayout title="Email Verified!" subtitle="Your email has been verified successfully">
		<div class="flex flex-col items-center gap-4 py-8">
			<FontAwesomeIcon icon={faCircleCheck} class="size-16 text-green-500" />
			<p class="text-muted-foreground">Redirecting to dashboard...</p>
		</div>
	</AuthLayout>
{:else if status === 'error'}
	<AuthLayout title="Verification Failed" subtitle="We couldn't verify your email">
		<div class="flex flex-col items-center gap-4 py-8">
			<FontAwesomeIcon icon={faCircleXmark} class="size-16 text-destructive" />
			<Alert variant="destructive">
				<AlertDescription>{errorMessage}</AlertDescription>
			</Alert>

			{#if resendError}
				<Alert variant="destructive">
					<AlertDescription>{resendError}</AlertDescription>
				</Alert>
			{/if}

			{#if resendSuccess}
				<Alert>
					<AlertDescription>Verification email sent! Check your inbox.</AlertDescription>
				</Alert>
			{/if}

			<Button onclick={resendVerification} disabled={isResending || !userEmail}>
				{#if isResending}
					<FontAwesomeIcon icon={faSpinner} class="mr-2 size-4 animate-spin" />
					Sending...
				{:else}
					Resend verification email
				{/if}
			</Button>

			{#if !userEmail}
				<p class="text-sm text-muted-foreground">
					<Link href="/login">Sign in</Link> to resend the verification email
				</p>
			{/if}
		</div>

		{#snippet footer()}
			<Link href="/login">Back to login</Link>
		{/snippet}
	</AuthLayout>
{:else}
	<AuthLayout title="Check Your Email" subtitle="We've sent a verification link to your inbox">
		<div class="flex flex-col items-center gap-6 py-8">
			<div class="flex size-16 items-center justify-center rounded-full bg-primary/10">
				<FontAwesomeIcon icon={faEnvelope} class="size-8 text-primary" />
			</div>
			{#if userEmail}
				<p class="text-center text-muted-foreground">
					We sent a verification link to
					<span class="font-medium text-foreground">{userEmail}</span>.
					Click the link to verify your account.
				</p>
			{:else}
				<p class="text-center text-muted-foreground">
					Click the link in your email to verify your account.
				</p>
			{/if}
			<p class="text-center text-sm text-muted-foreground">
				Check your spam folder if you don't see it.
			</p>

			{#if resendError}
				<Alert variant="destructive">
					<AlertDescription>{resendError}</AlertDescription>
				</Alert>
			{/if}

			{#if resendSuccess}
				<Alert>
					<AlertDescription>Verification email sent! Check your inbox.</AlertDescription>
				</Alert>
			{/if}

			<Button variant="outline" onclick={resendVerification} disabled={isResending || !userEmail}>
				{#if isResending}
					<FontAwesomeIcon icon={faSpinner} class="mr-2 size-4 animate-spin" />
					Sending...
				{:else}
					Resend verification email
				{/if}
			</Button>

			{#if !userEmail}
				<p class="text-sm text-muted-foreground">
					<Link href="/login">Sign in</Link> to resend the verification email
				</p>
			{/if}
		</div>

		{#snippet footer()}
			Already verified? <Link href="/login">Sign in</Link>
		{/snippet}
	</AuthLayout>
{/if}
