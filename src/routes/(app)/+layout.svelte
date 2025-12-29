<script lang="ts">
	import { AppHeader } from '$lib/components/app'
	import UserProvider from './UserProvider.svelte'

	import type { LayoutData } from './$types'

	const { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props()
</script>

<UserProvider user={data.user}>
	<div class="min-h-screen bg-background">
		<AppHeader />
		<main>
			{@render children()}
		</main>
	</div>
</UserProvider>
