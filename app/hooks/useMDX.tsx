import { compile, run } from '@mdx-js/mdx';
import { useSuspenseQuery } from '@tanstack/react-query';
import * as runtime from 'react/jsx-runtime';

async function compileMDX(mdx: string) {
	return String(await compile(mdx, { outputFormat: 'function-body' }));
}

async function runMDX(code: string) {
	const { default: content } = await run(code, { ...runtime, baseUrl: import.meta.url });
	return content;
}

export function useMDX(mdx: string) {
	//
	const { data } = useSuspenseQuery({
		queryKey: ['mdx', mdx],
		queryFn: async () => {
			const code = await compileMDX(mdx);
			return await runMDX(code);
		},
	});

	return data;
}
