<script lang="ts" module>
	import type { Snippet } from 'svelte'
	import type { HTMLAnchorAttributes } from 'svelte/elements'

	export interface LinkProps extends HTMLAnchorAttributes {
		/** Content to render */
		children: Snippet
	}
</script>

<script lang="ts">
	const { class: className, children, ...rest }: LinkProps = $props()
</script>

<a
	class="
		rounded text-primary underline underline-offset-4
		hover:text-primary/80
		focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none
		{className ?? ''}
	"
	{...rest}
>
	{@render children?.()}
</a>
