<script lang="ts">
	import { faMinus, faPlus } from '@fortawesome/pro-regular-svg-icons'
	import { FontAwesomeIcon } from '@fortawesome/svelte-fontawesome'

	import type { Cropper } from './cropper.svelte.js'

	interface Props {
		cropper: Cropper
	}

	const { cropper }: Props = $props()

	// Derived zoom value for the slider (0-100)
	const zoomValue = $derived(Math.round(cropper.getNormalizedZoom() * 100))

	function handleSliderChange(e: Event) {
		const target = e.target as HTMLInputElement
		const normalized = Number.parseInt(target.value, 10) / 100
		cropper.setZoom(normalized)
	}

	function handleZoomOut() {
		const current = cropper.getNormalizedZoom()
		cropper.setZoom(Math.max(0, current - 0.1))
	}

	function handleZoomIn() {
		const current = cropper.getNormalizedZoom()
		cropper.setZoom(Math.min(1, current + 0.1))
	}
</script>

<div class="flex items-center gap-3 px-4">
	<button
		type="button"
		onclick={handleZoomOut}
		class="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		aria-label="Zoom out"
	>
		<FontAwesomeIcon icon={faMinus} class="size-4" />
	</button>

	<div class="relative flex flex-1 items-center">
		<input
			type="range"
			min="0"
			max="100"
			value={zoomValue}
			oninput={handleSliderChange}
			class="h-2 w-full cursor-pointer appearance-none rounded-full bg-accent [&::-moz-range-thumb]:size-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:shadow-sm [&::-moz-range-thumb]:transition-transform [&::-moz-range-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow-sm [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110"
			aria-label="Zoom level"
		/>
	</div>

	<button
		type="button"
		onclick={handleZoomIn}
		class="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
		aria-label="Zoom in"
	>
		<FontAwesomeIcon icon={faPlus} class="size-4" />
	</button>
</div>
