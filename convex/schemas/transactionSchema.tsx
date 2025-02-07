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

export const transactionStatusSchema = z.enum(['started', 'pending', 'confirmed', 'failed']);

export const walletAddressSchema = z.string().describe('The address of the recipient.');

export const transactionSchema = z
	.object({
		reference: z.string().describe('A security reference for the transaction. Managed by us.'),
		to: walletAddressSchema,
		description: z.string(),
		payload: z.array(
			z.object({
				symbol: tokenSchema,
				amount: z.string(),
			}),
		),
		chain: blockchainSchema,
		status: transactionStatusSchema,
		owner: zid('users'),
		author: authorSchema,
	})
	.describe('A transaction to be executed on the blockchain.');
