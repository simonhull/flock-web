<script lang="ts" module>
	import type { Snippet } from 'svelte'

	export interface AuthLayoutProps {
		/** Page title for the heading */
		title: string
		/** Subtitle text below the heading */
		subtitle: string
		/** The form content */
		children: Snippet
		/** Footer content (typically "Already have an account?" link) */
		footer?: Snippet
	}
</script>

<script lang="ts">
	const { title, subtitle, children, footer }: AuthLayoutProps = $props()
</script>

<div class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
	<div class="w-full max-w-md space-y-8">
		<div class="text-center">
			<h1 class="text-3xl font-bold text-foreground">{title}</h1>
			<p class="mt-2 text-muted-foreground">{subtitle}</p>
		</div>

		{@render children?.()}

		{#if footer}
			<p class="text-center text-sm text-muted-foreground">
				{@render footer()}
			</p>
		{/if}
	</div>
</div>
