import { query } from '../_generated/server';
import { current as getCurrentUser } from '../users/public';

export const findAll = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await ctx.db
			.query('transactions')
			.withIndex('by_owner', (q) => q.eq('owner', currentUser._id))
			.collect();
	},
});
