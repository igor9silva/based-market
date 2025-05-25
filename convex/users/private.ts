import { zid } from 'convex-helpers/server/zod';
import { Id } from '../_generated/dataModel';
import { MutationCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';

export const _seedIfNeeded = async (
	ctx: MutationCtx, //
	userId: Id<'users'>,
) => {
	//
	const user = await _findOne(ctx, { userId });
	if (user?.isReady) return;

	console.info('new user!', userId);

	await _markAreReady(ctx, { userId });
};

export const _markAreReady = internalMutation({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		const user = await _findOne(ctx, { userId });
		if (!user) throw new Error('User not found');

		await ctx.db.patch(userId, { isReady: true });
	},
});

export const _findOne = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		return await ctx.db.get(userId);
	},
});
