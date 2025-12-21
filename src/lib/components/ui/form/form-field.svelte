<script lang="ts">
	import type { HTMLInputTypeAttribute, HTMLInputAttributes } from 'svelte/elements'
	import { Label } from '$lib/components/ui/label'
	import { Input } from '$lib/components/ui/input'
	import { cn } from '$lib/utils.js'

	// Remote function field interface (experimental API)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	interface RemoteField {
		as: (...args: any[]) => Record<string, unknown>
		issues: () => Array<{ path?: (string | number)[]; message: string }> | undefined
	}

	interface Props {
		field: RemoteField
		label: string
		type?: HTMLInputTypeAttribute
		hint?: string
		id?: string
		autocomplete?: HTMLInputAttributes['autocomplete']
		required?: boolean
		disabled?: boolean
		placeholder?: string
		class?: string
	}

	let {
		field,
		label,
		type = 'text',
		hint,
		id = crypto.randomUUID(),
		autocomplete,
		required,
		disabled,
		placeholder,
		class: className,
	}: Props = $props()

	const issues = $derived(field.issues() ?? [])
	const hasErrors = $derived(issues.length > 0)
</script>

<div class={cn('space-y-2', className)}>
	<Label for={id}>{label}</Label>
	<Input
		{...field.as(type)}
		{id}
		{type}
		{autocomplete}
		{required}
		{disabled}
		{placeholder}
		aria-invalid={hasErrors}
		aria-describedby={hasErrors ? `${id}-errors` : hint ? `${id}-hint` : undefined}
	/>
	{#if hasErrors}
		<div id={`${id}-errors`} class="text-sm text-destructive">
			{#each issues as issue (issue.message)}
				<p>{issue.message}</p>
			{/each}
		</div>
	{:else if hint}
		<p id={`${id}-hint`} class="text-sm text-muted-foreground">{hint}</p>
	{/if}
</div>
