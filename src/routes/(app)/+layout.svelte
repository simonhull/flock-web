<script lang="ts">
	import { getUser } from '$lib/auth.remote'
	import { setUserContext } from '$lib/stores/user.svelte'

	const { children } = $props()
</script>

<svelte:boundary>
	{#snippet pending()}
		<div class="flex min-h-screen items-center justify-center bg-background">
			<div class="animate-pulse text-muted-foreground">Loading...</div>
		</div>
	{/snippet}

	{@const user = await getUser()}
	{setUserContext(user)}

	{@render children()}
</svelte:boundary>
