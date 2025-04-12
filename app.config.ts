import mdx from '@mdx-js/rollup';
import { sentryVitePlugin } from '@sentry/vite-plugin';
import { defineConfig } from '@tanstack/start/config';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
	vite: {
		build: {
			sourcemap: true,
		},
		plugins: [
			tsConfigPaths({
				projects: ['./tsconfig.json'],
			}),
			mdx(),
			sentryVitePlugin({
				org: 'ispro',
				project: 'meseeks',
			}),
		],
	},
	tsr: {
		autoCodeSplitting: true,
	},
	server: {
		preset: 'vercel',
		esbuild: {
			options: {
				target: 'es2022',
			},
		},
	},
});
