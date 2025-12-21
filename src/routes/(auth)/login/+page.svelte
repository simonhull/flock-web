<script lang='ts'>
	import type { ActionData } from './$types'
	import { enhance } from '$app/forms'

	interface Props {
		form: ActionData
	}

	const { form }: Props = $props()
	let isSubmitting = $state(false)
</script>

<svelte:head>
	<title>Sign In | Flock</title>
</svelte:head>

<div class='
  flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12
'>
	<div class='w-full max-w-md space-y-8'>
		<div class='text-center'>
			<h1 class='text-3xl font-bold text-gray-900'>Welcome back</h1>
			<p class='mt-2 text-gray-600'>
				Sign in to connect with your communities
			</p>
		</div>

		<form
			method='POST'
			class='mt-8 space-y-6'
			use:enhance={() => {
				isSubmitting = true
				return async ({ update }) => {
					await update()
					isSubmitting = false
				}
			}}
		>
			{#if form?.error}
				<div
					class='rounded-md bg-red-50 p-4 text-sm text-red-700'
					role='alert'
					aria-live='polite'
				>
					{form.error}
				</div>
			{/if}

			<div class='space-y-4'>
				<div>
					<label for='email' class='block text-sm font-medium text-gray-700'>
						Email address
					</label>
					<input
						id='email'
						name='email'
						type='email'
						autocomplete='email'
						required
						value={form?.email ?? ''}
						aria-invalid={form?.errors?.['email'] ? 'true' : undefined}
						aria-describedby={form?.errors?.['email'] ? 'email-error' : undefined}
						class='
        mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
        focus:border-primary-500 focus:ring-2 focus:ring-primary-500
        focus:ring-offset-1 focus:outline-none
      '
						class:border-red-500={form?.errors?.['email']}
					/>
					{#if form?.errors?.['email']}
						<p id='email-error' class='mt-1 text-sm text-red-600' role='alert'>
							{form.errors['email']}
						</p>
					{/if}
				</div>

				<div>
					<label for='password' class='block text-sm font-medium text-gray-700'>
						Password
					</label>
					<input
						id='password'
						name='password'
						type='password'
						autocomplete='current-password'
						required
						aria-invalid={form?.errors?.['password'] ? 'true' : undefined}
						aria-describedby={form?.errors?.['password'] ? 'password-error' : undefined}
						class='
        mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm
        focus:border-primary-500 focus:ring-2 focus:ring-primary-500
        focus:ring-offset-1 focus:outline-none
      '
						class:border-red-500={form?.errors?.['password']}
					/>
					{#if form?.errors?.['password']}
						<p id='password-error' class='mt-1 text-sm text-red-600' role='alert'>
							{form.errors['password']}
						</p>
					{/if}
				</div>
			</div>

			<button
				type='submit'
				disabled={isSubmitting}
				class='
      flex w-full justify-center rounded-md border border-transparent
      bg-primary-600 px-4 py-3 text-sm font-medium text-white shadow-sm
      transition-colors
      hover:bg-primary-700
      focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none
      disabled:cursor-not-allowed disabled:opacity-50
    '
			>
				{#if isSubmitting}
					Signing in...
				{:else}
					Sign in
				{/if}
			</button>

			<p class='text-center text-sm text-gray-600'>
				Don't have an account?
				<a href='/register' class='
      rounded text-primary-600 underline
      hover:text-primary-500
      focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none
    '>
					Create one
				</a>
			</p>
		</form>
	</div>
</div>
