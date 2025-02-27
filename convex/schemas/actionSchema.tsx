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
	estimatedCost: z.bigint().optional(),
	approvedAt: z.number().optional(),
	approvedBy: z
		.union([
			zid('users'), //
			z.literal('auto'),
		])
		.optional(),
});

export const pendingActionSchema = coreActionSchema.extend({
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
