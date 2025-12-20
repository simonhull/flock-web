import antfu from '@antfu/eslint-config'
import betterTailwind from 'eslint-plugin-better-tailwindcss'

export default antfu({
	svelte: true,
	typescript: true,
	markdown: false,
	stylistic: {
		indent: 'tab',
		quotes: 'single',
	},
}, {
	plugins: { 'better-tailwindcss': betterTailwind },
	settings: {
		'better-tailwindcss': { entryPoint: 'src/app.css' },
	},
	rules: {
		...betterTailwind.configs.recommended.rules,
	},
})
