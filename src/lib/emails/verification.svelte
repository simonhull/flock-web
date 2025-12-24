<script lang="ts">
	import {
		Html,
		Head,
		Body,
		Preview,
		Container,
		Section,
		Text,
		Button,
	} from 'better-svelte-email'

	interface Props {
		name: string
		verificationUrl: string
	}

	let { name, verificationUrl }: Props = $props()
</script>

<Html>
	<Head />
	<Body class="bg-gray-100 font-sans">
		<Preview preview="Verify your Flock account" />
		<Container class="mx-auto my-8 max-w-lg rounded-xl bg-white p-8 shadow-sm">
			<Section class="text-center">
				<Text class="text-2xl font-bold text-gray-900">
					Welcome to Flock, {name}!
				</Text>
				<Text class="mt-4 text-gray-600">
					Please verify your email address to get started.
				</Text>
				<Button
					href={verificationUrl}
					class="mt-6 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white"
				>
					Verify Email
				</Button>
				<Text class="mt-6 text-sm text-gray-500">
					If you didn't create an account, you can safely ignore this email.
				</Text>
				<Text class="mt-4 text-xs text-gray-400">
					Or copy this link: {verificationUrl}
				</Text>
			</Section>
		</Container>
	</Body>
</Html>
