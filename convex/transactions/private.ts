import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalMutation, internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { blockchainSchema, tokenSchema, walletAddressSchema } from '../schemas/transactionSchema';

export const _add = internalMutation({
	args: {
		owner: zid('users'),
		author: authorSchema,
		to: walletAddressSchema,
		description: z.string(),
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: z.string(),
			}),
		),
		chain: blockchainSchema,
	},
	handler: async (ctx, { author, owner, to, description, payload, chain }) => {
		//
		const transactionId = await ctx.db.insert('transactions', {
			reference: crypto.randomUUID().replace(/-/g, ''),
			to,
			description,
			payload,
			chain,
			status: 'waiting',
			author,
			owner,
		});

		return transactionId;
	},
});

export const _findOne = internalQuery({
	args: {
		transactionId: zid('transactions'),
	},
	handler: async (ctx, { transactionId }) => {
		return await ctx.db.get(transactionId);
	},
});

export const _findAllWaiting = internalQuery({
	args: {
		owner: zid('users'),
	},
	handler: async (ctx, { owner }) => {
		return await ctx.db
			.query('transactions')
			.withIndex('by_status_owner', (q) =>
				q
					.eq('status', 'waiting') //
					.eq('owner', owner),
			)
			.collect();
	},
});
