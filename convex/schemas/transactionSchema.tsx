import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { tokenSchema, topUpAmountSchema } from './topUpSchema';

export const valueSchema = z.object({
	symbol: tokenSchema,
	amount: topUpAmountSchema,
});

export const topUpTransactionSchema = z.object({
	kind: z.literal('top up'),
	value: valueSchema,
	topUpId: zid('topUps'),
	owner: zid('users'),
});

export const taskCostTransactionSchema = z.object({
	kind: z.literal('task cost'),
	value: valueSchema,
	taskId: zid('tasks'),
	owner: zid('users'),
});

export const transactionSchema = z
	.union([
		topUpTransactionSchema, //
		taskCostTransactionSchema,
	])
	.describe(
		'A financial transaction. Top ups, pay outs and task/action execution costs.', //
	);
