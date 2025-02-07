import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { tokenSchema } from '../schemas/transactionSchema';
import { current as getCurrentUser } from '../users/public';
import { _add, _findOne } from './private';

export const startTopUp = mutation({
	args: {
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: z.string(),
			}),
		),
		description: z.string().optional(),
	},
	handler: async (ctx, { description, payload }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const transactionId = await _add(ctx, {
			author: currentUser._id,
			owner: currentUser._id,
			to: env.PAYMENT_ETH_ADDRESS_WLD_CHAIN,
			description: description || 'Top up Meseeks Actions.',
			payload,
		});

		const transaction = await _findOne(ctx, { transactionId });
		if (!transaction) throw new Error('Transaction not found');

		return {
			_id: transaction._id,
			reference: transaction.reference,
			payload: transaction.payload,
		};
	},
});

export const findOne = query({
	args: {
		transactionId: zid('transactions'),
	},
	handler: async (ctx, { transactionId }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});
		const transaction = await _findOne(ctx, { transactionId });

		if (!transaction) throw new Error('Transaction not found');
		if (transaction.owner !== currentUser._id) throw new Error('Transaction not found');

		return transaction;
	},
});
