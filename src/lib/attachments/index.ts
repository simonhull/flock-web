import type { Attachment } from 'svelte/attachments'

/**
 * Focuses the element when mounted.
 *
 * Usage:
 * <input {@attach autofocus} />
 */
export const autofocus: Attachment<HTMLElement> = (element) => {
	element.focus()
}

/**
 * Calls handler when clicking outside the element.
 *
 * Usage:
 * <div {@attach clickOutside(() => isOpen = false)}>...</div>
 */
export function clickOutside(handler: () => void): Attachment<HTMLElement> {
	return (element) => {
		function onClick(event: MouseEvent) {
			if (!element.contains(event.target as Node)) {
				handler()
			}
		}

		document.addEventListener('click', onClick, true)

		return () => {
			document.removeEventListener('click', onClick, true)
		}
	}
}

/**
 * Traps focus within the element (for modals/dialogs).
 *
 * Usage:
 * <div {@attach trapFocus}>...</div>
 */
export const trapFocus: Attachment<HTMLElement> = (element) => {
	const focusableSelector = [
		'a[href]',
		'button:not([disabled])',
		'input:not([disabled])',
		'select:not([disabled])',
		'textarea:not([disabled])',
		'[tabindex]:not([tabindex="-1"])',
	].join(', ')

	const focusableElements = element.querySelectorAll<HTMLElement>(focusableSelector)
	const first = focusableElements[0]
	const last = focusableElements[focusableElements.length - 1]

	function handleKeydown(event: KeyboardEvent) {
		if (event.key !== 'Tab') return

		if (event.shiftKey) {
			if (document.activeElement === first) {
				event.preventDefault()
				last?.focus()
			}
		} else {
			if (document.activeElement === last) {
				event.preventDefault()
				first?.focus()
			}
		}
	}

	element.addEventListener('keydown', handleKeydown)
	first?.focus()

	return () => {
		element.removeEventListener('keydown', handleKeydown)
	}
}
