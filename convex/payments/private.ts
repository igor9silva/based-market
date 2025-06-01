import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { internalMutation } from '../lib';
import { productSchema } from '../schemas/paymentSchema';
import { byCoinbaseId } from './public';

export function createPayment(
	ctx: ActionCtx,
	product: z.infer<typeof productSchema>,
	coinbaseId: string,
	gameId: Id<'games'>,
	sender?: string,
	chainId?: number,
	contractAddress?: string,
) {
	//
	return ctx.runMutation(internal.payments.private.create, {
		product,
		coinbaseId,
		gameId,
		sender,
		chainId,
		contractAddress,
	});
}

export function setPendingPayment(ctx: ActionCtx, coinbaseId: string) {
	//
	return ctx.runMutation(internal.payments.private.setPending, { coinbaseId });
}

export function finishPayment(ctx: ActionCtx, coinbaseId: string, status: 'confirmed' | 'failed') {
	//
	return ctx.runMutation(internal.payments.private.finish, { coinbaseId, status });
}

export const create = internalMutation({
	args: {
		product: productSchema,
		coinbaseId: z.string(),
		gameId: zid('games'),
		sender: z.string().optional(),
		chainId: z.number().optional(),
		contractAddress: z.string().optional(),
	},
	handler: async (ctx, { product, coinbaseId, gameId, sender, chainId, contractAddress }) => {
		await ctx.db.insert('payments', {
			product,
			coinbaseId,
			gameId,
			sender,
			chainId,
			contractAddress,
			status: 'created',
			isUsed: false,
		});
	},
});

export const createConfirmed = internalMutation({
	args: {
		product: productSchema,
		gameId: zid('games'),
		coinbaseId: z.string(),
	},
	handler: async (ctx, { product, gameId, coinbaseId }) => {
		//
		const paymentId = await ctx.db.insert('payments', {
			product,
			coinbaseId,
			gameId,
			status: 'confirmed', // immediately confirmed
			isUsed: false,
		});

		return { paymentId, coinbaseId, product };
	},
});

export const setPending = internalMutation({
	args: {
		coinbaseId: z.string(),
	},
	handler: async (ctx, { coinbaseId }) => {
		//
		const payment = await byCoinbaseId(ctx, { coinbaseId });
		if (!payment) throw new Error('Payment not found');

		await ctx.db.patch(payment._id, { status: 'pending' });
	},
});

export const finish = internalMutation({
	args: {
		coinbaseId: z.string(),
		status: z.enum(['confirmed', 'failed']),
	},
	handler: async (ctx, { coinbaseId, status }) => {
		//
		const payment = await byCoinbaseId(ctx, { coinbaseId });
		if (!payment) throw new Error('Payment not found');

		await ctx.db.patch(payment._id, { status });
	},
});
