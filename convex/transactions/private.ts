import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalAction, internalMutation, internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { env } from '../schemas/envSchema';
import {
	blockchainSchema,
	tokenSchema,
	transactionAmountSchema,
	walletAddressSchema,
} from '../schemas/transactionSchema';

export const _add = internalMutation({
	args: {
		owner: zid('users'),
		author: authorSchema,
		to: walletAddressSchema,
		description: z.string(),
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: transactionAmountSchema,
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

export const _finish = internalMutation({
	args: {
		transactionId: zid('transactions'),
		status: z.enum(['confirmed', 'failed']),
	},
	handler: async (ctx, { transactionId, status }) => {
		return await ctx.db.patch(transactionId, { status });
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

export const _fetchTransaction = internalAction({
	args: {
		payload: z.record(z.string(), z.any()),
	},
	handler: async (ctx, { payload }) => {
		//
		const response = await fetch(
			`https://developer.worldcoin.org/api/v2/minikit/transaction/${payload.transaction_id}?app_id=${env.WLD_CLIENT_ID}`,
			{
				method: 'GET',
				headers: { Authorization: `Bearer ${env.WLD_PORTAL_API_KEY}` },
			},
		);

		return (await response.json()) as {
			reference: string;
			transactionId: string;
			transactionHash: string;
			transactionStatus: 'pending' | 'mined' | 'failed';
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
