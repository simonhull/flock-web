<script lang="ts">
	import { getUser } from '$lib/auth.remote'
	import { setUserContext, type User } from '$lib/stores/user.svelte'

	const { children } = $props()

	// Store the promise, not the resolved value
	const userPromise = getUser()

	// Use a box object that we can mutate without triggering reactive errors
	const userBox: { current: User | null } = { current: null }
	setUserContext(() => userBox.current)
</script>

<svelte:boundary>
	{#snippet pending()}
		<div class="flex min-h-screen items-center justify-center bg-background">
			<div class="animate-pulse text-muted-foreground">Loading...</div>
		</div>
	{/snippet}

	{#snippet failed(error)}
		<div class="flex min-h-screen items-center justify-center bg-background">
			<div class="text-center">
				<p class="text-destructive">Failed to load session</p>
				<p class="mt-2 text-sm text-muted-foreground">Please refresh the page</p>
			</div>
		</div>
	{/snippet}

	<!-- Await the user and update the box (plain object mutation, not $state) -->
	{@const user = await userPromise}
	{void (userBox.current = user)}
	{@render children()}
</svelte:boundary>
