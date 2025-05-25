import { zid } from 'convex-helpers/server/zod';
import { internalMutation, internalQuery } from '../lib';
import { gameSchema } from '../schemas/gameSchema';

export const _add = internalMutation({
	args: {
		...gameSchema.shape,
	},
	handler: async (ctx, { owner }) => {
		//
		return await ctx.db.insert('games', {
			owner,
		});
	},
});

export const _findAll = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		return await ctx.db
			.query('games')
			.withIndex('by_owner', (q) => q.eq('owner', userId))
			.collect();
	},
});
