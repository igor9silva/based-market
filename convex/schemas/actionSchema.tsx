import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

const coreActionSchema = z.object({
	taskId: zid('tasks'),
	author: authorSchema,
	key: z.string(),
	args: z.record(z.any()),
});

const mutationSchema = coreActionSchema.extend({
	kind: z.literal('mutation'),
	result: z.string(),
});

const coreAsyncActionSchema = coreActionSchema.extend({
	kind: z.enum(['decision', 'tool']),
});

const asyncPendingSchema = coreAsyncActionSchema.extend({
	status: z.enum([
		'pending authorization', //
		'enqueued',
		'running',
	]),
});

const asyncDoneSchema = coreAsyncActionSchema.extend({
	status: z.enum([
		'succeeded', //
		'skipped',
		'failed',
	]),
	result: z.string(),
});

export const actionSchema = z
	.union([
		mutationSchema, //
		asyncPendingSchema,
		asyncDoneSchema,
	])
	.describe(
		'An Action is any occurrence within a Task. It may be a mutation, a decision or the use of a tool.', //
	);
