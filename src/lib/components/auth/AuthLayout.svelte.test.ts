import { describe, expect, it } from 'vitest'
import { render } from 'vitest-browser-svelte'
import AuthLayout from './AuthLayout.svelte'

describe('AuthLayout', () => {
	it('renders title as heading', async () => {
		const { getByRole } = render(AuthLayout, {
			props: {
				title: 'Welcome',
				subtitle: 'Sign in to continue',
			},
		})

		await expect.element(getByRole('heading', { level: 1 })).toHaveTextContent('Welcome')
	})

	it('renders subtitle', async () => {
		const { getByText } = render(AuthLayout, {
			props: {
				title: 'Test',
				subtitle: 'This is a subtitle',
			},
		})

		await expect.element(getByText('This is a subtitle')).toBeInTheDocument()
	})

	it('has centered layout container', async () => {
		const { container } = render(AuthLayout, {
			props: {
				title: 'Test',
				subtitle: 'Test subtitle',
			},
		})

		const wrapper = container.querySelector('.flex.min-h-screen')
		expect(wrapper).not.toBeNull()
		expect(wrapper).toHaveClass('items-center')
		expect(wrapper).toHaveClass('justify-center')
	})

	it('applies semantic background color', async () => {
		const { container } = render(AuthLayout, {
			props: {
				title: 'Test',
				subtitle: 'Test subtitle',
			},
		})

		const wrapper = container.querySelector('.bg-background')
		expect(wrapper).not.toBeNull()
	})

	it('applies foreground color to title', async () => {
		const { getByRole } = render(AuthLayout, {
			props: {
				title: 'Test Title',
				subtitle: 'Test subtitle',
			},
		})

		await expect.element(getByRole('heading', { level: 1 })).toHaveClass('text-foreground')
	})

	it('applies muted color to subtitle', async () => {
		const { getByText } = render(AuthLayout, {
			props: {
				title: 'Test',
				subtitle: 'Muted subtitle',
			},
		})

		await expect.element(getByText('Muted subtitle')).toHaveClass('text-muted-foreground')
	})

	it('has max width constraint', async () => {
		const { container } = render(AuthLayout, {
			props: {
				title: 'Test',
				subtitle: 'Test subtitle',
			},
		})

		const contentWrapper = container.querySelector('.max-w-md')
		expect(contentWrapper).not.toBeNull()
	})
})
