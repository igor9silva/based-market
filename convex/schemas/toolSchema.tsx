import { z } from 'zod';
import { authorSchema } from './authorSchema';

export const httpConfigSchema = z.object({
	url: z.string().url(),
	method: z.enum([
		'GET', //
		'POST',
		'PUT',
		'DELETE',
		'PATCH',
	]),
	headers: z.record(z.string()).describe('HTTP headers to send with the request'),
	paramMappings: z.array(
		z.object({
			type: z.enum([
				'search', //
				'header',
				'path',
				'body',
			]),
			source: z.string().describe('original parameter name'),
			target: z.string().describe('name on the URL, header, path, or body'),
		}),
	),
	body: z
		.object({
			template: z.record(z.any()).describe('Base JSON object with pre-filled values'),
		})
		.optional(),
});

export const toolOwnerSchema = z.union([
	authorSchema, // user or meseeks-defined tools
	z.literal('built-in'), // global tools
]);

export const httpToolSchema = z.object({
	key: z.string(),
	description: z.string(),
	parametersSchema: z.string(), // TODO: enforce that this is a valid zod schema
	http: httpConfigSchema,
	owner: toolOwnerSchema,
});

export const toolSchema = httpToolSchema.describe(
	'A Tool is an external API call that can be used by the user or Meseeks.', //
);
