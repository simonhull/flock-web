<script lang="ts">
	import { setUserContext, type User } from '$lib/stores/user.svelte'
	import type { Snippet } from 'svelte'

	interface Props {
		user: User | null
		children: Snippet
	}

	const { user, children }: Props = $props()

	// Set the context with a getter that returns the prop value
	setUserContext(() => user)
</script>

{@render children()}
