<script lang='ts'>
	import { enhance } from '$app/forms'

	let isLoggingOut = $state(false)
</script>

<svelte:head>
	<title>Dashboard | Flock</title>
</svelte:head>

<div class='min-h-screen bg-gray-50'>
	<nav class='bg-white shadow'>
		<div class='mx-auto flex max-w-4xl items-center justify-between px-4 py-4'>
			<h1 class='text-xl font-bold text-gray-900'>Flock</h1>
			<form
				method='POST'
				action='?/logout'
				use:enhance={() => {
					isLoggingOut = true
					return async ({ update }) => {
						await update()
						isLoggingOut = false
					}
				}}
			>
				<button
					type='submit'
					disabled={isLoggingOut}
					class='
       rounded px-2 py-1 text-sm text-gray-600 transition-colors
       hover:text-gray-900
       focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:outline-none
       disabled:opacity-50
     '
				>
					{isLoggingOut ? 'Signing out...' : 'Sign out'}
				</button>
			</form>
		</div>
	</nav>

	<main class='mx-auto max-w-4xl px-4 py-8'>
		<div class='rounded-lg bg-white p-6 shadow'>
			<h2 class='text-lg font-medium text-gray-900'>Welcome to Flock</h2>
			<p class='mt-2 text-gray-600'>
				You're signed in! This is a placeholder dashboard.
			</p>
			<p class='mt-4 text-sm text-gray-500'>
				Auth is working. Next: protected routes, user profile display.
			</p>
		</div>
	</main>
</div>
