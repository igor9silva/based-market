import { tool as AITool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { httpToolSchema } from '../schemas/toolSchema';
import { stringToZod } from '../utils/zodToString';

export function createHttpTool(
	ctx: ActionCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'> | undefined,
	tool: z.infer<typeof httpToolSchema>,
) {
	const metadata = {
		description: tool.description,
		parameters: stringToZod(tool.parametersSchema),
	};

	if (!action) return AITool(metadata);

	return AITool({
		...metadata,
		execute: async (args) => {
			//
			console.debug('Running tool', tool.key, args);

			const config = tool.config;
			const url = new URL(config.url);
			const headers = { ...config.headers };

			// apply parameter mappings and compute the request body
			const bodyData = config.paramMappings.reduce((body, { source, target, type }) => {
				//
				const value = args[source as keyof typeof args];

				switch (type) {
					case 'search':
						url.searchParams.set(target, String(value));
						break;
					case 'header':
						headers[target] = String(value);
						break;
					case 'path':
						url.pathname = url.pathname.replace(`:${target}`, String(value));
						break;
					case 'body':
						body[target] = value;
						break;
				}

				return body;
				//
			}, config.body?.template ?? {});

			console.debug('requesting', config.method, url.toString());

			// make the request
			const response = await fetch(url.toString(), {
				method: config.method,
				headers,
				body: Object.keys(bodyData).length > 0 ? JSON.stringify(bodyData) : undefined,
			});

			console.debug('Response', response.status, response.statusText);

			// treat everything as text and let the LLM do its magic
			const result = await response.text();
			console.debug('Result', result);

			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}. Body: ${result}`);
			}

			return result;
		},
	});
}
