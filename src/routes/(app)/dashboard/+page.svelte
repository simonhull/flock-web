<script lang="ts">
	import { goto } from '$app/navigation'
	import { logout } from '$lib/auth.remote'
	import { Button, Card, CardContent } from '$lib/components/ui'
	import { getUserContext } from '$lib/stores/user.svelte'

	const user = getUserContext()

	let signingOut = $state(false)

	async function handleLogout() {
		signingOut = true
		await logout()
		goto('/login')
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
		<Card>
			<CardContent class="pt-6">
				<h2 class="text-lg font-medium text-foreground">
					Welcome{user?.name ? `, ${user.name}` : ''}!
				</h2>
				<p class="mt-2 text-muted-foreground">
					You're signed in as <span class="font-medium">{user?.email}</span>
				</p>
				<p class="mt-4 text-sm text-muted-foreground">
					Your identity belongs to you. Take it anywhere.
				</p>
			</CardContent>
		</Card>
	</main>
</div>
