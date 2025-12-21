import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import Link from './Link.svelte'

describe('Link', () => {
	it('renders and has link role', async () => {
		const { getByRole } = render(Link, {
			href: '/test',
		})

		await expect.element(getByRole('link')).toBeInTheDocument()
	})

	it('applies href attribute', async () => {
		const { getByRole } = render(Link, {
			href: '/dashboard',
		})

		await expect.element(getByRole('link')).toHaveAttribute('href', '/dashboard')
	})

	it('applies custom className', async () => {
		const { getByRole } = render(Link, {
			href: '/test',
			class: 'custom-class',
		})

		await expect.element(getByRole('link')).toHaveClass('custom-class')
	})

	it('forwards additional HTML attributes', async () => {
		const { getByRole } = render(Link, {
			props: {
				href: '/test',
				target: '_blank',
				rel: 'noopener noreferrer',
			},
		})

		const link = getByRole('link')
		await expect.element(link).toHaveAttribute('target', '_blank')
		await expect.element(link).toHaveAttribute('rel', 'noopener noreferrer')
	})

	it('has correct base styling', async () => {
		const { getByRole } = render(Link, {
			href: '/test',
		})

		const link = getByRole('link')
		await expect.element(link).toHaveClass('text-primary')
		await expect.element(link).toHaveClass('underline')
	})
})
