<script lang="ts">
	import { goto } from '$app/navigation'
	import {
		Avatar,
		AvatarFallback,
		AvatarImage,
	} from '$lib/components/ui/avatar'
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from '$lib/components/ui/dropdown-menu'
	import { getUserContext } from '$lib/stores/user.svelte'

	const user = getUserContext()

	// Generate initials from user name or email
	const initials = $derived.by(() => {
		if (user?.name) {
			const parts = user.name.trim().split(/\s+/)
			const first = parts[0]?.[0] ?? ''
			const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
			return (first + last).toUpperCase()
		}
		if (user?.email) {
			return user.email[0]?.toUpperCase() ?? '?'
		}
		return '?'
	})

	async function handleSignOut() {
		try {
			await fetch('/api/auth/sign-out', { method: 'POST' })
			goto('/login')
		} catch {
			// Force navigation even if sign-out request fails
			goto('/login')
		}
	}
</script>

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
	<div class="flex h-14 items-center justify-between px-4 md:px-6">
		<!-- Logo -->
		<a href="/dashboard" class="flex items-center">
			<img src="/logo.svg" alt="Flock" class="h-8" />
		</a>

		<!-- Avatar Dropdown -->
		<DropdownMenu>
			<DropdownMenuTrigger class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
				<Avatar class="size-9 cursor-pointer transition-opacity hover:opacity-80">
					{#if user?.image}
						<AvatarImage src={user.image} alt={user.name ?? 'User avatar'} />
					{/if}
					<AvatarFallback class="bg-primary text-primary-foreground text-sm font-medium">
						{initials}
					</AvatarFallback>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" class="w-48">
				<DropdownMenuItem onclick={handleSignOut} class="cursor-pointer">
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>
</header>
