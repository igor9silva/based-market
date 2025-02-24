import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';
import { tokenSchema } from './topUpSchema';

const coreActionSchema = z.object({
	taskId: zid('tasks'),
	owner: zid('users'),
	author: authorSchema,
	skillKey: z.string(),
	args: z.record(z.any()),
	kind: z.enum(['sync', 'async']),
});

export const pendingActionSchema = coreActionSchema.extend({
	kind: z.literal('async'),
	status: z.enum([
		'pending authorization', //
		'enqueued',
		'running',
	]),
	result: z.null().optional().default(null), // <------
});

export const resolvedActionSchema = coreActionSchema.extend({
	status: z.enum([
		'succeeded', //
		'skipped',
		'failed',
	]),
	result: z.string(),
	costs: z.array(
		z.object({
			symbol: tokenSchema,
			amount: z.bigint(),
			description: z.string(),
		}),
	),
});

export const actionSchema = z
	.union([
		pendingActionSchema, //
		resolvedActionSchema,
	])
	.describe(
		'An Action is any occurrence within a Task.', //
	);
