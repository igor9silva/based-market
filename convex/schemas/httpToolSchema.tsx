import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const paramMappingSchema = z.object({
	type: z.enum(['queryParam', 'header', 'pathParam', 'body']),
	source: z.string().describe('original parameter name'),
	target: z.string().describe('name in the HTTP request'),
});

export const httpConfigSchema = z.object({
	url: z.string().url(),
	method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
	headers: z.record(z.string()),
	paramMappings: z.array(paramMappingSchema),
	body: z
		.object({
			contentType: z.enum(['application/json']),
			template: z.record(z.any()).describe('Base JSON object with pre-filled values'),
		})
		.optional(),
});

export const toolOwnerSchema = z.union([
	zid('users'), // user-defined tools
	z.literal('built-in'), // global tools
]);

export const httpToolSchema = z.object({
	name: z.string(),
	description: z.string(),
	parametersSchema: z.string(),
	http: httpConfigSchema,
	owner: toolOwnerSchema,
});
