import { zid } from 'convex-helpers/server/zod';
import { internalMutation } from '../lib';
import { valueSchema } from '../schemas/transactionSchema';
import { _adjustBalance } from '../users/private';

export const _addTopUp = internalMutation({
	args: {
		value: valueSchema,
		topUpId: zid('topUps'),
		owner: zid('users'),
	},
	handler: async (ctx, args) => {
		//
		const transactionId = await ctx.db.insert('transactions', {
			kind: 'top up',
			...args,
		});

		if (args.value.symbol !== 'WLD') throw new Error('Only WLD is supported for now');

		await _adjustBalance(ctx, {
			userId: args.owner,
			value: {
				symbol: args.value.symbol,
				amount: args.value.amount,
			},
		});

		return transactionId;
	},
});

export const _addTaskCost = internalMutation({
	args: {
		value: valueSchema,
		taskId: zid('tasks'),
		owner: zid('users'),
	},
	handler: async (ctx, args) => {
		//
		const transactionId = await ctx.db.insert('transactions', {
			kind: 'task cost',
			...args,
		});

		if (args.value.symbol !== 'WLD') throw new Error('Only WLD is supported for now');

		await _adjustBalance(ctx, {
			userId: args.owner,
			value: {
				symbol: args.value.symbol,
				amount: -args.value.amount,
			},
		});

		return transactionId;
	},
});
