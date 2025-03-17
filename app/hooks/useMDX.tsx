import { compile, run } from '@mdx-js/mdx';
import { useQuery } from '@tanstack/react-query';
import * as runtime from 'react/jsx-runtime';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

async function compileMDX(mdx: string) {
	return String(
		await compile(mdx, {
			outputFormat: 'function-body',
			remarkPlugins: [
				remarkGfm, //
				remarkBreaks,
			],
		}),
	);
}

async function runMDX(code: string) {
	//
	const { default: content } = await run(code, {
		...runtime,
		baseUrl: import.meta.url,
	});

	return content;
}

export function useMDX(mdx: string) {
	//
	const {
		data: Component,
		error,
		isPending,
	} = useQuery({
		retry: false,
		queryKey: ['mdx', mdx],
		queryFn: async () => {
			const code = await compileMDX(mdx);
			return await runMDX(code);
		},
		staleTime: Infinity,
	});

	return { Component, error, isPending };
}
