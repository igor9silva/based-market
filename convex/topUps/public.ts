import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { blockchainSchema, tokenSchema, topUpAmountSchema } from '../schemas/topUpSchema';
import { current as getCurrentUser } from '../users/public';
import { _add, _findAllByStatus, _findAllWaiting, _findOne, _finish } from './private';

export const startTopUp = mutation({
	args: {
		chain: blockchainSchema,
		symbol: tokenSchema,
		amount: topUpAmountSchema,
		description: z.string().optional(),
	},
	handler: async (ctx, { chain, symbol, amount, description }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const topUpId = await _add(ctx, {
			author: currentUser._id,
			owner: currentUser._id,
			to: env.PAYMENT_ETH_ADDRESS_BASE_CHAIN,
			description: description || 'Top up Meseeks USD credits.',
			chain,
			symbol,
			amount,
		});

		// TODO: auto-confirm for mocking purposes
		await _finish(ctx, { topUpId, status: 'confirmed' });

		return topUpId;
	},
});

export const discard = mutation({
	args: {
		topUpId: zid('topUps'),
	},
	handler: async (ctx, { topUpId }) => {
		//
		const topUp = await findOne(ctx, { topUpId });

		if (topUp.status !== 'waiting') throw new Error('TopUp cannot be discarded anymore');

		return await ctx.db.patch(topUpId, { status: 'discarded by user' });
	},
});

export const findOne = query({
	args: {
		topUpId: zid('topUps'),
	},
	handler: async (ctx, { topUpId }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});
		const topUp = await _findOne(ctx, { topUpId });

		if (!topUp) throw new Error('TopUp not found');
		if (topUp.owner !== currentUser._id) throw new Error('TopUp not found');

		return topUp;
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
