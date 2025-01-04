import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { httpToolSchema } from '../schemas/httpToolSchema';
import { stringToZod } from '../utils/zodToString';

export function createHttpTool(
	ctx: ActionCtx,
	task: Doc<'tasks'>,
	action: (Doc<'taskActions'> & { kind: 'run-tool' }) | undefined,
	config: z.infer<typeof httpToolSchema>,
) {
	const metadata = {
		description: config.description,
		parameters: stringToZod(config.parametersSchema),
	};

	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async (args) => {
			//
			console.debug('Running tool', config.name, args);

			await ctx.runMutation(internal.taskEvents._setToolCallStatusText, {
				eventId: action.origin,
				text: `Running ${config.name}`,
			});

			const url = new URL(config.http.url);
			const headers = { ...config.http.headers };

			// apply parameter mappings
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

			console.debug('URL', url.toString(), headers, config.http.paramMappings);

			// make the request
			const response = await fetch(url.toString(), {
				method: config.http.method,
				headers,
			});

			console.debug('Response', response.status, response.statusText);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// treat everything as text and let the LLM do it's magic
			const result = await response.text();

			console.debug('Result', result);

			return result;
		},
	});
}
