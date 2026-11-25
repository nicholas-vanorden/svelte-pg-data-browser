import adapter from '@sveltejs/adapter-node';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-node builds a standalone Node server into build/ (run with `node build`).
		// See https://svelte.dev/docs/kit/adapter-node
		adapter: adapter()
	},
	vitePlugin: {
		dynamicCompileOptions: ({ filename }) =>
			filename.includes('node_modules') ? undefined : { runes: true }
	}
};

export default config;
