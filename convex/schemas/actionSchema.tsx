import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

const coreActionSchema = z.object({
	taskId: zid('tasks'),
	owner: zid('users'),
	author: authorSchema,
	toolKey: z.string(),
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
	result: z.null().optional().default(null),
});

export const resolvedActionSchema = coreActionSchema.extend({
	status: z.enum([
		'succeeded', //
		'skipped',
		'failed',
	]),
	result: z.string(),
});

export const actionSchema = z
	.union([
		pendingActionSchema, //
		resolvedActionSchema,
	])
	.describe(
		'An Action is any occurrence within a Task.', //
	);
