<script lang="ts">
	import { getUser } from '$lib/auth.remote'
	import UserProvider from './UserProvider.svelte'

	const { children } = $props()
</script>

{#await getUser()}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="animate-pulse text-muted-foreground">Loading...</div>
	</div>
{:then user}
	<UserProvider {user}>
		{@render children()}
	</UserProvider>
{:catch}
	<div class="flex min-h-screen items-center justify-center bg-background">
		<div class="text-center">
			<p class="text-destructive">Failed to load session</p>
			<p class="mt-2 text-sm text-muted-foreground">Please refresh the page</p>
		</div>
	</div>
{/await}
