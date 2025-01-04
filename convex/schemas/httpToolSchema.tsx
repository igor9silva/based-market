import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

const ParamMappingSchema = z.object({
	type: z.enum(['queryParam', 'header', 'pathParam']),
	source: z.string().describe('original parameter name'),
	target: z.string().describe('name in the HTTP request'),
});

const HttpConfigSchema = z.object({
	url: z.string().url(),
	method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
	headers: z.record(z.string()),
	paramMappings: z.array(ParamMappingSchema),
});

export const httpToolSchema = z.object({
	name: z.string(),
	description: z.string(),
	parametersSchema: z.string(),
	http: HttpConfigSchema,
	owner: zid('users').optional(),
});
