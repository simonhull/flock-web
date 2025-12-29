<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js'
	import * as Dialog from '$lib/components/ui/dialog/index.js'

	import type { CropResult, ImageCropperProps } from './types.js'
	import { createCropper } from './cropper.svelte.js'
	import CropperCanvas from './CropperCanvas.svelte'
	import CropperControls from './CropperControls.svelte'

	const {
		image,
		aspectRatio,
		outputSize = 512,
		circular = false,
		quality = 0.92,
		onConfirm,
		onCancel,
	}: ImageCropperProps = $props()

	let open = $state(true)
	let loading = $state(true)
	let exporting = $state(false)
	let error = $state<string | null>(null)

	const cropper = createCropper({
		aspectRatio,
		outputSize,
		quality,
	})

	// Load image when component mounts
	$effect(() => {
		loadImage()
	})

	async function loadImage() {
		loading = true
		error = null

		try {
			await cropper.loadImage(image)
			loading = false
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load image'
			loading = false
		}
	}

	async function handleConfirm() {
		if (exporting) return

		exporting = true
		error = null

		try {
			const result: CropResult = await cropper.exportCrop()
			cropper.destroy()
			open = false
			onConfirm(result)
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to export image'
			exporting = false
		}
	}

	function handleCancel() {
		open = false
		onCancel()
	}

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			cropper.destroy()
			onCancel()
		}
	}

	// Clean up on unmount
	$effect(() => {
		return () => cropper.destroy()
	})

	// Calculate canvas aspect ratio - add padding around the crop frame
	// For square (1:1), canvas is slightly taller to give breathing room
	// For wide (16:9), canvas matches the wide ratio
	const canvasAspectRatio = $derived(
		aspectRatio >= 1
			? Math.max(1, aspectRatio * 0.9) // Wide or square: slightly less tall
			: aspectRatio * 1.2 // Portrait: slightly wider
	)
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden p-0">
		<Dialog.Header class="flex-none border-b px-6 py-4">
			<Dialog.Title>Crop Image</Dialog.Title>
		</Dialog.Header>

		<div class="relative w-full bg-black/95" style:aspect-ratio={canvasAspectRatio}>
			{#if loading}
				<div class="flex h-full items-center justify-center">
					<div class="size-8 animate-spin rounded-full border-4 border-muted border-t-primary"></div>
				</div>
			{:else if error}
				<div class="flex h-full flex-col items-center justify-center gap-4 p-8 text-center">
					<p class="text-destructive">{error}</p>
					<Button variant="outline" onclick={loadImage}>Try Again</Button>
				</div>
			{:else}
				<CropperCanvas {cropper} {circular} />
			{/if}
		</div>

		{#if !loading && !error}
			<div class="flex-none border-t bg-background py-4">
				<CropperControls {cropper} />
			</div>
		{/if}

		<Dialog.Footer class="flex-none border-t px-6 py-4">
			<Button variant="outline" onclick={handleCancel} disabled={exporting}>Cancel</Button>
			<Button onclick={handleConfirm} disabled={loading || !!error || exporting}>
				{#if exporting}
					<div class="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
					Applying...
				{:else}
					Apply
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
