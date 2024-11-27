import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from './lib';

export const current = query({
	args: {},
	handler: async (ctx) => {
		//
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const user = await ctx.db.get(userId);
		if (!user) throw new Error('Not found');

		return user;
	},
});
