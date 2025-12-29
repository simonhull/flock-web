<script lang="ts">
	import { goto } from '$app/navigation'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Label } from '$lib/components/ui/label'
	import { ImageCropper, type CropResult } from '$lib/components/ui/image-cropper'

	import type { PageData } from './$types'

	const { data }: { data: PageData } = $props()

	// Form state
	let firstName = $state('')
	let lastName = $state('')
	let birthday = $state('')
	let gender = $state<'male' | 'female' | 'prefer_not_to_say' | null>(null)

	// Avatar state
	let avatarUrl = $state<string | null>(null)
	let avatarPreviewUrl = $state<string | null>(null)
	let avatarFile = $state<File | null>(null)
	let showCropper = $state(false)
	let selectedFile = $state<File | null>(null)

	// Form state
	let isSubmitting = $state(false)
	let error = $state<string | null>(null)

	// Progressive reveal - show birthday/gender after name is filled
	const showExtendedFields = $derived(firstName.trim().length > 0 && lastName.trim().length > 0)

	// Form validation
	const canSubmit = $derived(
		firstName.trim().length > 0 &&
			lastName.trim().length > 0 &&
			birthday.length > 0 &&
			gender !== null &&
			!isSubmitting
	)

	// Generate initials from name
	const initials = $derived(() => {
		const first = firstName.trim()[0] ?? ''
		const last = lastName.trim()[0] ?? ''
		return (first + last).toUpperCase()
	})

	// Display URL (preview during upload, then actual URL)
	const displayAvatarUrl = $derived(avatarPreviewUrl ?? avatarUrl)

	// File input reference
	let fileInput: HTMLInputElement

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement
		const file = target.files?.[0]
		if (!file) return

		// Validate file type
		const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
		if (!allowedTypes.includes(file.type)) {
			error = 'Please select a JPEG, PNG, or WebP image'
			target.value = ''
			return
		}

		// Validate file size (5MB max)
		if (file.size > 5 * 1024 * 1024) {
			error = 'Image must be less than 5MB'
			target.value = ''
			return
		}

		selectedFile = file
		showCropper = true
		target.value = ''
	}

	function handleCropConfirm(result: CropResult) {
		showCropper = false
		avatarPreviewUrl = result.previewUrl
		// Store the blob as a File for upload
		avatarFile = new File([result.blob], 'avatar.jpg', { type: result.blob.type })
		selectedFile = null
	}

	function handleCropCancel() {
		showCropper = false
		selectedFile = null
	}

	function handleAvatarClick() {
		if (!isSubmitting) {
			fileInput.click()
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault()
		if (!canSubmit) return

		isSubmitting = true
		error = null

		try {
			// First, upload avatar if we have one
			let uploadedAvatarUrl: string | null = null

			if (avatarFile) {
				const formData = new FormData()
				formData.append('file', avatarFile)

				const uploadResponse = await fetch('/api/v1/profile/avatar', {
					method: 'POST',
					body: formData,
				})

				if (!uploadResponse.ok) {
					const uploadError = (await uploadResponse.json()) as { error?: string }
					throw new Error(uploadError.error ?? 'Failed to upload avatar')
				}

				const uploadResult = (await uploadResponse.json()) as { data: { url: string } }
				uploadedAvatarUrl = uploadResult.data.url
			}

			// Create profile
			const response = await fetch('/api/v1/profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					firstName: firstName.trim(),
					lastName: lastName.trim(),
					birthday,
					gender,
					avatarUrl: uploadedAvatarUrl,
				}),
			})

			if (!response.ok) {
				const result = (await response.json()) as { error?: string }
				throw new Error(result.error ?? 'Failed to create profile')
			}

			// Success! Redirect to dashboard
			goto('/dashboard')
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong'
			isSubmitting = false
		}
	}
</script>

<svelte:head>
	<title>Complete Your Profile | Flock</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-gradient-to-b from-background to-muted/30 p-4">
	<div class="w-full max-w-md">
		<!-- The Flowing Card -->
		<form
			onsubmit={handleSubmit}
			class="rounded-2xl border bg-card p-8 shadow-lg transition-all duration-300"
		>
			<!-- Header -->
			<div class="mb-8 text-center">
				<h1 class="text-2xl font-semibold tracking-tight">Welcome to Flock</h1>
				<p class="mt-2 text-muted-foreground">Let's set up your profile</p>
			</div>

			<!-- Avatar -->
			<div class="mb-8 flex justify-center">
				<button
					type="button"
					onclick={handleAvatarClick}
					class="group relative size-24 overflow-hidden rounded-full bg-gradient-to-br from-primary/80 to-primary transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					disabled={isSubmitting}
				>
					{#if displayAvatarUrl}
						<img src={displayAvatarUrl} alt="Your avatar" class="size-full object-cover" />
					{:else}
						<span class="flex size-full items-center justify-center text-2xl font-semibold text-primary-foreground">
							{initials() || '?'}
						</span>
					{/if}

					<!-- Hover overlay -->
					<div
						class="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
					>
						<svg
							class="size-6 text-white"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
							/>
							<path stroke-linecap="round" stroke-linejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
						</svg>
					</div>
				</button>

				<input
					bind:this={fileInput}
					type="file"
					accept="image/jpeg,image/png,image/webp"
					class="hidden"
					onchange={handleFileSelect}
					disabled={isSubmitting}
				/>
			</div>

			<!-- Name Fields -->
			<div class="space-y-4">
				<div class="grid gap-4 sm:grid-cols-2">
					<div class="space-y-2">
						<Label for="firstName">First name</Label>
						<Input
							id="firstName"
							bind:value={firstName}
							placeholder="Jane"
							autocomplete="given-name"
							disabled={isSubmitting}
							required
						/>
					</div>
					<div class="space-y-2">
						<Label for="lastName">Last name</Label>
						<Input
							id="lastName"
							bind:value={lastName}
							placeholder="Doe"
							autocomplete="family-name"
							disabled={isSubmitting}
							required
						/>
					</div>
				</div>

				<!-- Extended Fields (birthday + gender) - Progressive Reveal -->
				{#if showExtendedFields}
					<div class="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
						<!-- Birthday -->
						<div class="space-y-2">
							<Label for="birthday">Birthday</Label>
							<Input
								id="birthday"
								type="date"
								bind:value={birthday}
								disabled={isSubmitting}
								required
							/>
						</div>

						<!-- Gender -->
						<div class="space-y-2">
							<Label>Gender</Label>
							<div class="flex gap-2">
								<button
									type="button"
									onclick={() => (gender = 'male')}
									class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors {gender ===
									'male'
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}"
									disabled={isSubmitting}
								>
									Male
								</button>
								<button
									type="button"
									onclick={() => (gender = 'female')}
									class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors {gender ===
									'female'
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}"
									disabled={isSubmitting}
								>
									Female
								</button>
								<button
									type="button"
									onclick={() => (gender = 'prefer_not_to_say')}
									class="flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-colors {gender ===
									'prefer_not_to_say'
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-input bg-background hover:bg-accent hover:text-accent-foreground'}"
									disabled={isSubmitting}
								>
									Prefer not to say
								</button>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Error Message -->
			{#if error}
				<div class="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
					{error}
				</div>
			{/if}

			<!-- Submit Button -->
			<div class="mt-8">
				<Button type="submit" class="w-full" disabled={!canSubmit}>
					{#if isSubmitting}
						<div class="mr-2 size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
						Setting up...
					{:else}
						Let's go!
					{/if}
				</Button>
			</div>
		</form>
	</div>
</div>

<!-- Image Cropper Modal -->
{#if showCropper && selectedFile}
	<ImageCropper
		image={selectedFile}
		aspectRatio={1}
		circular
		outputSize={512}
		onConfirm={handleCropConfirm}
		onCancel={handleCropCancel}
	/>
{/if}
