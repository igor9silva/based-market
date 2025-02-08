import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { api, internal } from '../_generated/api';
import { action, mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { tokenSchema, topUpAmountSchema } from '../schemas/topUpSchema';
import { current as getCurrentUser } from '../users/public';
import { _add, _fetchTopUp, _findAllByStatus, _findAllWaiting, _findOne } from './private';

export const startTopUp = mutation({
	args: {
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: topUpAmountSchema,
			}),
		),
		description: z.string().optional(),
	},
	handler: async (ctx, { description, payload }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const topUpId = await _add(ctx, {
			author: currentUser._id,
			owner: currentUser._id,
			to: env.PAYMENT_ETH_ADDRESS_WLD_CHAIN,
			description: description || 'Top up Meseeks Actions.',
			payload,
		});

		const topUp = await _findOne(ctx, { topUpId });
		if (!topUp) throw new Error('TopUp not found');

		return {
			_id: topUp._id,
			payload: topUp.payload,
		};
	},
});

export const confirmPayment = action({
	args: {
		topUpId: zid('topUps'),
		finalPayload: z.record(z.string(), z.any()),
	},
	handler: async (ctx, { topUpId, finalPayload }) => {
		//
		const topUp = await ctx.runQuery(api.topUps.public.findOne, { topUpId });

		if (topUp.status !== 'waiting') throw new Error('TopUp not waiting');

		console.debug('finalPayload from app', finalPayload);
		const payload = await _fetchTopUp(ctx, { payload: finalPayload });
		console.debug('payload', payload);

		// optimistically confirm the topUp.
		if (payload.reference === topUpId && payload.topUpStatus !== 'failed') {
			//
			// TODO: set to pending and check until confirmed
			await ctx.runMutation(internal.topUps.private._finish, { topUpId, status: 'confirmed' });

			// actually increase user's balance
			await ctx.runMutation(internal.transactions.private._addTopUp, {
				topUpId,
				owner: topUp.owner,
				value: {
					symbol: tokenSchema.parse(payload.inputToken),
					amount: topUpAmountSchema.parse(payload.inputTokenAmount),
				},
			});
			//
		} else {
			await ctx.runMutation(internal.topUps.private._finish, { topUpId, status: 'failed' });
		}
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
