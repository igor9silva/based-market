import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalAction, internalMutation, internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { env } from '../schemas/envSchema';
import { blockchainSchema, tokenSchema, topUpAmountSchema, walletAddressSchema } from '../schemas/topUpSchema';

export const _add = internalMutation({
	args: {
		owner: zid('users'),
		author: authorSchema,
		to: walletAddressSchema,
		description: z.string(),
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: topUpAmountSchema,
			}),
		),
		chain: blockchainSchema,
	},
	handler: async (ctx, { author, owner, to, description, payload, chain }) => {
		//
		const topUpId = await ctx.db.insert('topUps', {
			to,
			description,
			payload,
			chain,
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
export const _fetchTopUp = internalAction({
	args: {
		payload: z.record(z.string(), z.any()),
	},
	handler: async (ctx, { payload }) => {
		//
		const response = await fetch(
			`https://developer.worldcoin.org/api/v2/minikit/topUp/${payload.topUp_id}?app_id=${env.WLD_CLIENT_ID}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${env.WLD_PORTAL_API_KEY}` },
			},
		);

		if (!response.ok) {
			console.error('Failed to fetch top up', await response.text());
			throw new Error('Failed to fetch top up');
		}

		return (await response.json()) as {
			reference: string;
			topUpId: string;
			topUpHash: string;
			topUpStatus: 'pending' | 'mined' | 'failed';
			miniappId: string;
			updatedAt: string; // ISO 8601
			network: 'worldchain';
			fromWalletAddress: string;
			recipientAddress: string;
			inputToken: string;
			inputTokenAmount: string; // amount in BigInt with 6 decimals
		};
	},
});
