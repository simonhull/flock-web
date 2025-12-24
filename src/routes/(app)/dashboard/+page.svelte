<script lang="ts">
	import { goto } from '$app/navigation'
	import { auth } from '$lib/auth/client'
	import { logout } from '$lib/auth.remote'
	import { Alert, AlertDescription, Button, Card, CardContent } from '$lib/components/ui'
	import { getUserContext } from '$lib/stores/user.svelte'
	import LoaderCircle from 'lucide-svelte/icons/loader-circle'
	import CheckCircle from 'lucide-svelte/icons/check-circle'
	import AlertCircle from 'lucide-svelte/icons/alert-circle'

	const user = getUserContext()

	let signingOut = $state(false)
	let isResending = $state(false)
	let resendSuccess = $state(false)

	async function handleLogout() {
		signingOut = true
		await logout()
		goto('/login')
	}

	async function resendVerification() {
		if (!user?.email) return

		isResending = true
		resendSuccess = false

		try {
			await auth.sendVerificationEmail({
				email: user.email,
				callbackURL: '/dashboard',
			})
			resendSuccess = true
			setTimeout(() => (resendSuccess = false), 5000)
		}
		catch (err) {
			console.error('Failed to resend:', err)
		}
		finally {
			isResending = false
		}
	}
</script>

<svelte:head>
	<title>Dashboard | Flock</title>
</svelte:head>

<div class="min-h-screen bg-background">
	<nav class="bg-card shadow">
		<div class="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
			<h1 class="text-xl font-bold text-foreground">Flock</h1>
			<Button variant="ghost" onclick={handleLogout} disabled={signingOut}>
				{signingOut ? 'Signing out...' : 'Sign out'}
			</Button>
		</div>
	</nav>

	<main class="mx-auto max-w-4xl px-4 py-8">
		{#if user && !user.emailVerified}
			<Alert class="mb-6">
				<AlertCircle class="h-4 w-4" />
				<AlertDescription class="flex items-center justify-between">
					<span>Please verify your email address to access all features.</span>
					<Button
						variant="outline"
						size="sm"
						onclick={resendVerification}
						disabled={isResending}
					>
						{#if isResending}
							<LoaderCircle class="mr-2 h-3 w-3 animate-spin" />
							Sending...
						{:else}
							Resend email
						{/if}
					</Button>
				</AlertDescription>
			</Alert>

			{#if resendSuccess}
				<Alert class="mb-6">
					<CheckCircle class="h-4 w-4 text-green-500" />
					<AlertDescription>Verification email sent! Check your inbox.</AlertDescription>
				</Alert>
			{/if}
		{/if}

		<Card>
			<CardContent class="pt-6">
				<h2 class="text-lg font-medium text-foreground">
					Welcome{user?.name ? `, ${user.name}` : ''}!
				</h2>
				<p class="mt-2 text-muted-foreground">
					You're signed in as <span class="font-medium">{user?.email}</span>
					{#if user?.emailVerified}
						<span
							class="ml-2 inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700 dark:bg-green-900/30 dark:text-green-400"
						>
							<CheckCircle class="h-3 w-3" />
							Verified
						</span>
					{:else}
						<span
							class="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
						>
							<AlertCircle class="h-3 w-3" />
							Not verified
						</span>
					{/if}
				</p>
				<p class="mt-4 text-sm text-muted-foreground">
					Your identity belongs to you. Take it anywhere.
				</p>
			</CardContent>
		</Card>
	</main>
</div>
