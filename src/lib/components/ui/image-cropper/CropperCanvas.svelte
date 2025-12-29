<script lang="ts">
	import type { Cropper } from './cropper.svelte.js'

	interface Props {
		cropper: Cropper
		circular?: boolean
	}

	const { cropper, circular = false }: Props = $props()

	let canvas: HTMLCanvasElement | null = $state(null)
	let container: HTMLDivElement | null = $state(null)

	// Pointer tracking for pan and pinch-zoom
	const pointers = new Map<number, PointerEvent>()
	let lastPointerPos = { x: 0, y: 0 }
	let lastPinchDistance = 0

	// Initialize canvas when mounted and container resizes
	$effect(() => {
		if (!container || !canvas) return

		const resizeObserver = new ResizeObserver((entries) => {
			const entry = entries[0]
			if (!entry) return

			const { width, height } = entry.contentRect
			if (width > 0 && height > 0) {
				canvas!.width = width
				canvas!.height = height
				cropper.initializeDimensions(width, height)
				requestRender()
			}
		})

		resizeObserver.observe(container)

		return () => resizeObserver.disconnect()
	})

	// Render loop
	let renderRequested = false

	function requestRender() {
		if (renderRequested) return
		renderRequested = true
		requestAnimationFrame(() => {
			renderRequested = false
			render()
		})
	}

	function render() {
		if (!canvas) return
		const ctx = canvas.getContext('2d')
		if (!ctx) return
		cropper.render(ctx, circular)
	}

	// Re-render when cropper state changes
	$effect(() => {
		// Access state to create dependency
		void cropper.state.scale
		void cropper.state.offsetX
		void cropper.state.offsetY
		requestRender()
	})

	// Pointer event handlers
	function handlePointerDown(e: PointerEvent) {
		if (!canvas) return

		canvas.setPointerCapture(e.pointerId)
		pointers.set(e.pointerId, e)

		if (pointers.size === 1) {
			// Single pointer: start pan
			lastPointerPos = { x: e.clientX, y: e.clientY }
		} else if (pointers.size === 2) {
			// Two pointers: start pinch
			lastPinchDistance = getPinchDistance()
		}
	}

	function handlePointerMove(e: PointerEvent) {
		if (!pointers.has(e.pointerId)) return

		pointers.set(e.pointerId, e)

		if (pointers.size === 1) {
			// Pan
			const deltaX = e.clientX - lastPointerPos.x
			const deltaY = e.clientY - lastPointerPos.y
			cropper.pan(deltaX, deltaY)
			lastPointerPos = { x: e.clientX, y: e.clientY }
		} else if (pointers.size === 2) {
			// Pinch zoom
			const newDistance = getPinchDistance()
			const scale = newDistance / lastPinchDistance
			const center = getPinchCenter()

			const rect = canvas!.getBoundingClientRect()
			const x = center.x - rect.left
			const y = center.y - rect.top

			cropper.zoomTo(cropper.state.scale * scale, x, y)
			lastPinchDistance = newDistance
		}
	}

	function handlePointerUp(e: PointerEvent) {
		pointers.delete(e.pointerId)

		if (pointers.size === 1) {
			// Transitioning from pinch to pan
			const remaining = pointers.values().next().value
			if (remaining) {
				lastPointerPos = { x: remaining.clientX, y: remaining.clientY }
			}
		}
	}

	function handleWheel(e: WheelEvent) {
		e.preventDefault()

		if (!canvas) return

		const rect = canvas.getBoundingClientRect()
		const x = e.clientX - rect.left
		const y = e.clientY - rect.top

		// Zoom in/out based on wheel direction
		const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1
		cropper.zoomTo(cropper.state.scale * zoomFactor, x, y)
	}

	function getPinchDistance(): number {
		const points = Array.from(pointers.values())
		const p0 = points[0]
		const p1 = points[1]
		if (!p0 || !p1) return 0

		const dx = p1.clientX - p0.clientX
		const dy = p1.clientY - p0.clientY
		return Math.sqrt(dx * dx + dy * dy)
	}

	function getPinchCenter(): { x: number; y: number } {
		const points = Array.from(pointers.values())
		const p0 = points[0]
		const p1 = points[1]
		if (!p0 || !p1) return { x: 0, y: 0 }

		return {
			x: (p0.clientX + p1.clientX) / 2,
			y: (p0.clientY + p1.clientY) / 2,
		}
	}
</script>

<div bind:this={container} class="relative size-full cursor-grab select-none active:cursor-grabbing">
	<canvas
		bind:this={canvas}
		class="size-full touch-none"
		onpointerdown={handlePointerDown}
		onpointermove={handlePointerMove}
		onpointerup={handlePointerUp}
		onpointercancel={handlePointerUp}
		onpointerleave={handlePointerUp}
		onwheel={handleWheel}
	></canvas>
</div>
