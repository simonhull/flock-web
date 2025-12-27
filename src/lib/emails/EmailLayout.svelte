<script lang="ts">
	import { Body, Container, Head, Html, Preview, Section, Text } from 'better-svelte-email'
	import type { Snippet } from 'svelte'

	interface Props {
		preview: string
		children: Snippet
	}

	let { preview, children }: Props = $props()
</script>

<Html>
	<Head />
	<Body style="background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0;">
		<Preview {preview} />
		<Container style="margin: 40px auto; max-width: 560px; padding: 0 20px;">
			<!-- Header -->
			<Section style="margin-bottom: 32px; text-align: center;">
				<Text style="color: #009DD1; font-size: 24px; font-weight: 700; letter-spacing: -0.5px; margin: 0;">
					Flock
				</Text>
			</Section>

			<!-- Content Card -->
			<Section style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08); padding: 32px;">
				{@render children()}
			</Section>

			<!-- Footer -->
			<Section style="margin-top: 32px; text-align: center;">
				<Text style="color: #9ca3af; font-size: 12px; margin: 0;">
					Questions? Reach us at support@myflock.app
				</Text>
			</Section>
		</Container>
	</Body>
</Html>
