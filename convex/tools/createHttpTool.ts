import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { toolSchema } from '../schemas/toolSchema';
import { stringToZod } from '../utils/zodToString';

export function createHttpTool(
	ctx: ActionCtx,
	task: Doc<'tasks'>,
	operation: (Doc<'operations'> & { kind: 'run-tool' }) | undefined,
	config: z.infer<typeof toolSchema>,
) {
	const metadata = {
		description: config.description,
		parameters: stringToZod(config.parametersSchema),
	};

	if (!operation) return tool(metadata);

	return tool({
		...metadata,
		execute: async (args) => {
			//
			console.debug('Running tool', config.name, args);

			await ctx.runMutation(internal.events._setToolCallStatusText, {
				eventId: operation.origin,
				text: `Running ${config.name}`,
			});

			const url = new URL(config.http.url);
			const headers = { ...config.http.headers };

			// apply parameter mappings and compute the request body
			const bodyData = config.http.paramMappings.reduce((body, { source, target, type }) => {
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
			}, config.http.body?.template ?? {});

			console.debug('requesting', config.http.method, url.toString(), headers, bodyData);

			// make the request
			const response = await fetch(url.toString(), {
				method: config.http.method,
				headers,
				body: Object.keys(bodyData).length > 0 ? JSON.stringify(bodyData) : undefined,
			});

			console.debug('Response', response.status, response.statusText);

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			// treat everything as text and let the LLM do its magic
			const result = await response.text();

			console.debug('Result', result);

			return result;
		},
	});
}
