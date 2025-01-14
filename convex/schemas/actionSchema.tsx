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
			template: z.record(z.any()).describe('Base JSON object with pre-filled values'),
		})
		.optional(),
});

export const actionOwnerSchema = z.union([
	zid('users'), // user-defined actions
	z.literal('built-in'), // global actions
]);

export const httpActionSchema = z.object({
	name: z.string(),
	description: z.string(),
	parametersSchema: z.string(),
	http: httpConfigSchema,
	owner: actionOwnerSchema,
});

export const actionSchema = httpActionSchema.describe(
	'An Action is a function that can be executed by either the user or Meseeks.',
);

// export const actionSchema = z.union([
// 	httpActionSchema,
// ]);
