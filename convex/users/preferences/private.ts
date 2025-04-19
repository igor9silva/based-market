import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalMutation, internalQuery } from '../../lib';

export const _getUserPreferece = internalQuery({
	args: {
		userId: zid('users'),
		key: z.string(),
	},
	handler: async (ctx, { userId, key }) => {
		//
		const preference = await ctx.db
			.query('user_preferences')
			.withIndex('by_owner_key', (q) => q.eq('owner', userId).eq('key', key))
			.unique();

		return preference;
	},
});

export const _setUserPreference = internalMutation({
	args: {
		userId: zid('users'),
		key: z.string(),
		value: z.any(),
	},
	handler: async (ctx, { userId, key, value }) => {
		//
		const preference = await _getUserPreferece(ctx, { userId, key });

		if (!preference) {
			await ctx.db.insert('user_preferences', { owner: userId, key, value });
		} else {
			await ctx.db.patch(preference._id, { value });
		}
	},
});
