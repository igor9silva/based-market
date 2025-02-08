import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

export const blockchainSchema = z
	.enum([
		'worldchain', //
		'optimism',
	])
	.default('worldchain');

export const tokenSchema = z.enum([
	'USDCE', //
	'WLD',
]);

export const topUpStatusSchema = z.enum([
	'waiting', //
	'pending',
	'confirmed',
	'failed',
	'discarded by user',
]);

export const walletAddressSchema = z.string().describe('The address of the recipient.');

export const topUpAmountSchema = z.number().min(0.1, 'Minimum amount is $0.1').max(100000, 'That much? Are you sure?');

export const topUpSchema = z
	.object({
		to: walletAddressSchema,
		description: z.string(),
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: topUpAmountSchema,
			}),
		),
		chain: blockchainSchema,
		status: topUpStatusSchema,
		owner: zid('users'),
		author: authorSchema,
	})
	.describe('A topUp to be executed on the blockchain.');
