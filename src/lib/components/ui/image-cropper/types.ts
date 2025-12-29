/**
 * Result returned after cropping completes
 */
export interface CropResult {
	/** The cropped image as a Blob, ready for upload */
	blob: Blob
	/** Object URL for instant preview display */
	previewUrl: string
}

/**
 * Props for the ImageCropper component
 */
export interface ImageCropperProps {
	/** The source image file to crop */
	image: File
	/** Aspect ratio of the crop area (e.g., 1 for square, 16/9 for wide) */
	aspectRatio: number
	/** Output size in pixels for the largest dimension (default: 512) */
	outputSize?: number
	/** Whether to show a circular mask overlay (default: false) */
	circular?: boolean
	/** Quality for lossy formats, 0.0-1.0 (default: 0.92) */
	quality?: number
	/** Called when user confirms the crop */
	onConfirm: (result: CropResult) => void
	/** Called when user cancels */
	onCancel: () => void
}

/**
 * Internal state for the cropper
 */
export interface CropperState {
	/** Current zoom scale (1 = minimum, fills frame) */
	scale: number
	/** Minimum allowed scale (calculated from image/frame dimensions) */
	minScale: number
	/** Maximum allowed scale (based on output resolution) */
	maxScale: number
	/** Pan offset X in pixels */
	offsetX: number
	/** Pan offset Y in pixels */
	offsetY: number
}

/**
 * Dimensions for the crop frame and image
 */
export interface CropperDimensions {
	/** Canvas width */
	canvasWidth: number
	/** Canvas height */
	canvasHeight: number
	/** Crop frame width */
	frameWidth: number
	/** Crop frame height */
	frameHeight: number
	/** Crop frame X position */
	frameX: number
	/** Crop frame Y position */
	frameY: number
	/** Original image width */
	imageWidth: number
	/** Original image height */
	imageHeight: number
}
