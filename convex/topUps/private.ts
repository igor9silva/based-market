import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalMutation, internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { blockchainSchema, tokenSchema, topUpAmountSchema, walletAddressSchema } from '../schemas/topUpSchema';

export const _add = internalMutation({
	args: {
		owner: zid('users'),
		author: authorSchema,
		to: walletAddressSchema,
		description: z.string(),
		chain: blockchainSchema,
		symbol: tokenSchema,
		amount: topUpAmountSchema,
	},
	handler: async (ctx, { author, owner, to, description, chain, symbol, amount }) => {
		//
		const topUpId = await ctx.db.insert('topUps', {
			to,
			description,
			chain,
			symbol,
			amount,
			status: 'waiting',
			author,
			owner,
		});

		return topUpId;
	},
});

export const _finish = internalMutation({
	args: {
		topUpId: zid('topUps'),
		status: z.enum(['confirmed', 'failed']),
	},
	handler: async (ctx, { topUpId, status }) => {
		return await ctx.db.patch(topUpId, { status });
	},
});

export const _findOne = internalQuery({
	args: {
		topUpId: zid('topUps'),
	},
	handler: async (ctx, { topUpId }) => {
		return await ctx.db.get(topUpId);
	},
});

export const _findAllWaiting = internalQuery({
	args: {
		owner: zid('users'),
	},
	handler: async (ctx, { owner }) => {
		return await ctx.db
			.query('topUps')
			.withIndex('by_status_owner', (q) =>
				q
					.eq('status', 'waiting') //
					.eq('owner', owner),
			)
			.collect();
	},
});

export const _findAllByStatus = internalQuery({
	args: {
		owner: zid('users'),
		status: z.enum([
			'confirmed', //
			'failed',
			'pending',
			'waiting',
			'discarded by user',
		]),
	},
	handler: async (ctx, { owner, status }) => {
		return await ctx.db
			.query('topUps')
			.withIndex('by_status_owner', (q) =>
				q
					.eq('status', status) //
					.eq('owner', owner),
			)
			.collect();
	},
});
