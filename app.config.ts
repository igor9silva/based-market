import mdx from '@mdx-js/rollup';
import { defineConfig } from '@tanstack/start/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	vite: {
		build: {
			target: 'es2022',
		},
		plugins: [
			tsConfigPaths({
				projects: ['./tsconfig.json'],
			}),
			mdx(),
		],
	},
	tsr: {
		autoCodeSplitting: true,
	},
	server: {
		preset: 'vercel',
	},
});
