import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const userSchema = z.object({
	name: z.string().optional(),
	image: z.string().optional(),
	email: z.string().optional(),
	emailVerificationTime: z.number().optional(),
	phone: z.string().optional(),
	phoneVerificationTime: z.number().optional(),
	isAnonymous: z.literal(false).default(false),
	verificationLevel: z.enum(['orb', 'device']).optional(),
	walletAddress: z.string().optional(), // TODO: write a validator
	walletChain: z.enum(['worldchain']).optional(),
	isReady: z.boolean().default(false),
	balanceUSD: z.bigint().default(0n),
});

export const userPreferencesSchema = z.object({
	owner: zid('users'),
	instructions: z.string().optional().describe('The instructions for the user'),
});
