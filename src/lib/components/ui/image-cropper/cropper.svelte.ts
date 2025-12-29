import type { CropperDimensions, CropperState, CropResult } from './types.js'

/**
 * Creates a cropper instance with all the core logic for pan, zoom, render, and export.
 * This is a Svelte 5 composable that manages the cropper state and operations.
 */
export function createCropper(options: {
	aspectRatio: number
	outputSize: number
	quality: number
}) {
	const { aspectRatio, outputSize, quality } = options

	// Reactive state
	const state = $state<CropperState>({
		scale: 1,
		minScale: 1,
		maxScale: 4,
		offsetX: 0,
		offsetY: 0,
	})

	const dimensions = $state<CropperDimensions>({
		canvasWidth: 0,
		canvasHeight: 0,
		frameWidth: 0,
		frameHeight: 0,
		frameX: 0,
		frameY: 0,
		imageWidth: 0,
		imageHeight: 0,
	})

	let image: HTMLImageElement | null = null
	let imageObjectUrl: string | null = null
	let mimeType = 'image/jpeg'

	/**
	 * Load an image file and initialize the cropper
	 */
	async function loadImage(file: File): Promise<void> {
		// Clean up previous object URL if any
		if (imageObjectUrl) {
			URL.revokeObjectURL(imageObjectUrl)
		}

		mimeType = file.type || 'image/jpeg'

		return new Promise((resolve, reject) => {
			const img = new Image()
			img.onload = () => {
				image = img
				dimensions.imageWidth = img.naturalWidth
				dimensions.imageHeight = img.naturalHeight

				// If canvas is already sized, recalculate and position
				if (dimensions.canvasWidth > 0 && dimensions.canvasHeight > 0) {
					calculateScaleLimits()
					initializePosition()
				}

				resolve()
			}
			img.onerror = () => reject(new Error('Failed to load image'))
			imageObjectUrl = URL.createObjectURL(file)
			img.src = imageObjectUrl
		})
	}

	/**
	 * Clean up resources
	 */
	function destroy(): void {
		if (imageObjectUrl) {
			URL.revokeObjectURL(imageObjectUrl)
			imageObjectUrl = null
		}
		image = null
	}

	/**
	 * Initialize dimensions based on container size
	 */
	function initializeDimensions(containerWidth: number, containerHeight: number): void {
		dimensions.canvasWidth = containerWidth
		dimensions.canvasHeight = containerHeight

		// Calculate frame size to fit within container with padding
		const padding = 40
		const maxFrameWidth = containerWidth - padding * 2
		const maxFrameHeight = containerHeight - padding * 2

		if (aspectRatio >= 1) {
			// Landscape or square: width constrained
			dimensions.frameWidth = Math.min(maxFrameWidth, maxFrameHeight * aspectRatio)
			dimensions.frameHeight = dimensions.frameWidth / aspectRatio
		}
		else {
			// Portrait: height constrained
			dimensions.frameHeight = Math.min(maxFrameHeight, maxFrameWidth / aspectRatio)
			dimensions.frameWidth = dimensions.frameHeight * aspectRatio
		}

		// Center the frame
		dimensions.frameX = (containerWidth - dimensions.frameWidth) / 2
		dimensions.frameY = (containerHeight - dimensions.frameHeight) / 2

		// Calculate scale limits
		calculateScaleLimits()

		// Initialize to fill frame (centered)
		initializePosition()
	}

	/**
	 * Calculate min/max scale based on image and output dimensions
	 */
	function calculateScaleLimits(): void {
		if (!image) return

		const { frameWidth, frameHeight, imageWidth, imageHeight } = dimensions

		// Min scale: image must fill the frame (no letterboxing)
		const scaleToFillWidth = frameWidth / imageWidth
		const scaleToFillHeight = frameHeight / imageHeight
		state.minScale = Math.max(scaleToFillWidth, scaleToFillHeight)

		// Max scale: prevent zooming past output resolution
		// If output is 512px and image is 2048px, max scale is 4x the minScale
		const outputWidth = aspectRatio >= 1 ? outputSize : outputSize * aspectRatio
		const outputHeight = aspectRatio >= 1 ? outputSize / aspectRatio : outputSize
		const pixelsPerOutputPixelX = imageWidth / outputWidth
		const pixelsPerOutputPixelY = imageHeight / outputHeight
		const maxPixelRatio = Math.min(pixelsPerOutputPixelX, pixelsPerOutputPixelY)

		// Max scale is when 1 source pixel = 1 output pixel
		state.maxScale = state.minScale * maxPixelRatio

		// Ensure max is at least min
		state.maxScale = Math.max(state.maxScale, state.minScale)

		// Clamp current scale to valid range
		state.scale = Math.max(state.minScale, Math.min(state.maxScale, state.scale))
	}

	/**
	 * Initialize image position to fill and center in frame
	 */
	function initializePosition(): void {
		if (!image) return

		state.scale = state.minScale

		const scaledWidth = dimensions.imageWidth * state.scale
		const scaledHeight = dimensions.imageHeight * state.scale

		// Center the image on the frame
		state.offsetX = dimensions.frameX + (dimensions.frameWidth - scaledWidth) / 2
		state.offsetY = dimensions.frameY + (dimensions.frameHeight - scaledHeight) / 2
	}

	/**
	 * Constrain offset so image always covers the frame
	 */
	function constrainOffset(): void {
		const scaledWidth = dimensions.imageWidth * state.scale
		const scaledHeight = dimensions.imageHeight * state.scale

		// Image right edge must be >= frame right edge
		const maxOffsetX = dimensions.frameX
		// Image left edge must be <= frame left edge
		const minOffsetX = dimensions.frameX + dimensions.frameWidth - scaledWidth

		// Image bottom edge must be >= frame bottom edge
		const maxOffsetY = dimensions.frameY
		// Image top edge must be <= frame top edge
		const minOffsetY = dimensions.frameY + dimensions.frameHeight - scaledHeight

		state.offsetX = Math.max(minOffsetX, Math.min(maxOffsetX, state.offsetX))
		state.offsetY = Math.max(minOffsetY, Math.min(maxOffsetY, state.offsetY))
	}

	/**
	 * Set zoom level (0-1 normalized)
	 */
	function setZoom(normalized: number): void {
		const newScale = state.minScale + normalized * (state.maxScale - state.minScale)

		// Zoom towards center of frame
		const centerX = dimensions.frameX + dimensions.frameWidth / 2
		const centerY = dimensions.frameY + dimensions.frameHeight / 2

		zoomTo(newScale, centerX, centerY)
	}

	/**
	 * Zoom to a specific scale, anchored at a point
	 */
	function zoomTo(newScale: number, anchorX: number, anchorY: number): void {
		const clampedScale = Math.max(state.minScale, Math.min(state.maxScale, newScale))

		// Calculate position relative to image before zoom
		const imageX = (anchorX - state.offsetX) / state.scale
		const imageY = (anchorY - state.offsetY) / state.scale

		// Update scale
		state.scale = clampedScale

		// Calculate new offset to keep anchor point stationary
		state.offsetX = anchorX - imageX * state.scale
		state.offsetY = anchorY - imageY * state.scale

		constrainOffset()
	}

	/**
	 * Get normalized zoom value (0-1)
	 */
	function getNormalizedZoom(): number {
		if (state.maxScale === state.minScale) return 0
		return (state.scale - state.minScale) / (state.maxScale - state.minScale)
	}

	/**
	 * Pan the image by a delta
	 */
	function pan(deltaX: number, deltaY: number): void {
		state.offsetX += deltaX
		state.offsetY += deltaY
		constrainOffset()
	}

	/**
	 * Render the cropper to a canvas context
	 */
	function render(ctx: CanvasRenderingContext2D, circular: boolean): void {
		if (!image) return

		const { canvasWidth, canvasHeight, frameX, frameY, frameWidth, frameHeight } = dimensions

		// Clear canvas
		ctx.clearRect(0, 0, canvasWidth, canvasHeight)

		// Draw image
		const scaledWidth = dimensions.imageWidth * state.scale
		const scaledHeight = dimensions.imageHeight * state.scale
		ctx.drawImage(image, state.offsetX, state.offsetY, scaledWidth, scaledHeight)

		// Draw dark overlay with hole using evenodd fill rule
		ctx.save()
		ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
		ctx.beginPath()

		// Outer rectangle (clockwise)
		ctx.moveTo(0, 0)
		ctx.lineTo(canvasWidth, 0)
		ctx.lineTo(canvasWidth, canvasHeight)
		ctx.lineTo(0, canvasHeight)
		ctx.closePath()

		// Inner hole (counter-clockwise for evenodd)
		if (circular) {
			const centerX = frameX + frameWidth / 2
			const centerY = frameY + frameHeight / 2
			const radius = Math.min(frameWidth, frameHeight) / 2
			// Draw circle counter-clockwise
			ctx.moveTo(centerX + radius, centerY)
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2, true)
		}
		else {
			// Draw rectangle counter-clockwise
			ctx.moveTo(frameX, frameY)
			ctx.lineTo(frameX, frameY + frameHeight)
			ctx.lineTo(frameX + frameWidth, frameY + frameHeight)
			ctx.lineTo(frameX + frameWidth, frameY)
			ctx.closePath()
		}

		ctx.fill('evenodd')
		ctx.restore()

		// Draw border around crop area
		ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)'
		ctx.lineWidth = 2

		if (circular) {
			const centerX = frameX + frameWidth / 2
			const centerY = frameY + frameHeight / 2
			const radius = Math.min(frameWidth, frameHeight) / 2
			ctx.beginPath()
			ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
			ctx.stroke()
		}
		else {
			ctx.strokeRect(frameX, frameY, frameWidth, frameHeight)
		}
	}

	/**
	 * Export the cropped image
	 */
	async function exportCrop(): Promise<CropResult> {
		if (!image) throw new Error('No image loaded')

		// Calculate output dimensions
		let outputWidth: number
		let outputHeight: number

		if (aspectRatio >= 1) {
			outputWidth = outputSize
			outputHeight = Math.round(outputSize / aspectRatio)
		}
		else {
			outputHeight = outputSize
			outputWidth = Math.round(outputSize * aspectRatio)
		}

		// Create export canvas
		const canvas = document.createElement('canvas')
		canvas.width = outputWidth
		canvas.height = outputHeight
		const ctx = canvas.getContext('2d')

		if (!ctx) throw new Error('Failed to get canvas context')

		// Calculate source rectangle (in original image coordinates)
		const sourceX = (dimensions.frameX - state.offsetX) / state.scale
		const sourceY = (dimensions.frameY - state.offsetY) / state.scale
		const sourceWidth = dimensions.frameWidth / state.scale
		const sourceHeight = dimensions.frameHeight / state.scale

		// Draw cropped region
		ctx.drawImage(
			image,
			sourceX,
			sourceY,
			sourceWidth,
			sourceHeight,
			0,
			0,
			outputWidth,
			outputHeight,
		)

		// Convert to blob
		const blob = await new Promise<Blob>((resolve, reject) => {
			canvas.toBlob(
				(b) => {
					if (b) resolve(b)
					else reject(new Error('Failed to create blob'))
				},
				mimeType,
				quality,
			)
		})

		const previewUrl = URL.createObjectURL(blob)

		return { blob, previewUrl }
	}

	return {
		get state() {
			return state
		},
		get dimensions() {
			return dimensions
		},
		loadImage,
		initializeDimensions,
		setZoom,
		zoomTo,
		getNormalizedZoom,
		pan,
		render,
		exportCrop,
		destroy,
	}
}

export type Cropper = ReturnType<typeof createCropper>
