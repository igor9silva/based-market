import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

type ParamMapping = {
	source: string; // original parameter name
	target: string; // name in the HTTP request
	type: 'queryParam' | 'header' | 'pathParam';
};

export type HttpConfig = {
	url: string;
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	headers: Record<string, string>;
	paramMappings: ParamMapping[];
};

export type ToolConfig<TParams extends z.ZodType> = {
	name: string;
	description: string;
	parameters: TParams;
	http: HttpConfig;
	jsonKeyPath?: string;
};

export function createHttpTool<TParams extends z.ZodType>(
	ctx: ActionCtx,
	task: Doc<'tasks'>,
	action: (Doc<'taskActions'> & { kind: 'run-tool' }) | undefined,
	config: ToolConfig<TParams>,
) {
	//
	const metadata = {
		description: config.description,
		parameters: config.parameters,
	};

	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async (args: z.infer<TParams>) => {
			//
			console.log('Running tool', config.name);
			console.log('Args', args);

			await ctx.runMutation(internal.taskEvents._setToolCallStatusText, {
				eventId: action.origin,
				text: `Running ${config.name}`,
			});

			const url = new URL(config.http.url);
			const headers = { ...config.http.headers };

			// Apply parameter mappings
			config.http.paramMappings.forEach(({ source, target, type }) => {
				//
				const value = String(args[source as keyof typeof args]);

				switch (type) {
					case 'queryParam':
						url.searchParams.set(target, value);
						break;
					case 'header':
						headers[target] = value;
						break;
					case 'pathParam':
						url.pathname = url.pathname.replace(`:${target}`, value);
						break;
				}
			});

			console.log('URL', url.toString());
			console.log('Headers', headers);
			console.log('Params Mappings', config.http.paramMappings);

			// Make the request
			const response = await fetch(url.toString(), {
				method: config.http.method,
				headers,
			});

			console.log('Response', response);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const result = await response.text();

			console.log('Result', result);

			return result;
		},
	});
}
