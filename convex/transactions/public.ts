import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { api, internal } from '../_generated/api';
import { action, mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { tokenSchema, transactionAmountSchema } from '../schemas/transactionSchema';
import { current as getCurrentUser } from '../users/public';
import { _add, _fetchTransaction, _findAllByStatus, _findAllWaiting, _findOne } from './private';

export const startTopUp = mutation({
	args: {
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: transactionAmountSchema,
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
			payload: transaction.payload,
		};
	},
});

export const confirmPayment = action({
	args: {
		transactionId: zid('transactions'),
		finalPayload: z.record(z.string(), z.any()),
	},
	handler: async (ctx, { transactionId, finalPayload }) => {
		//
		const transaction = await ctx.runQuery(api.transactions.public.findOne, { transactionId });

		if (transaction.status !== 'waiting') throw new Error('Transaction not waiting');

		const payload = await _fetchTransaction(ctx, { payload: finalPayload });
		console.debug('payload', payload);

		// optimistically confirm the transaction.
		if (payload.reference === transactionId && payload.transactionStatus !== 'failed') {
			// TODO: set to pending and check until confirmed
			await ctx.runMutation(internal.transactions.private._finish, { transactionId, status: 'confirmed' });
		} else {
			await ctx.runMutation(internal.transactions.private._finish, { transactionId, status: 'failed' });
		}
	},
});

export const discard = mutation({
	args: {
		transactionId: zid('transactions'),
	},
	handler: async (ctx, { transactionId }) => {
		//
		const transaction = await findOne(ctx, { transactionId });

		if (transaction.status !== 'waiting') throw new Error('Transaction cannot be discarded anymore');

		return await ctx.db.patch(transactionId, { status: 'discarded by user' });
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

export const findAllWaiting = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await _findAllWaiting(ctx, { owner: currentUser._id });
	},
});

export const findAllHistory = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const [confirmed, failed, pending] = await Promise.all([
			_findAllByStatus(ctx, { owner: currentUser._id, status: 'confirmed' }),
			_findAllByStatus(ctx, { owner: currentUser._id, status: 'failed' }),
			_findAllByStatus(ctx, { owner: currentUser._id, status: 'pending' }),
		]);

		return confirmed
			.concat(failed)
			.concat(pending)
			.sort((a, b) => b._creationTime - a._creationTime);
	},
});
