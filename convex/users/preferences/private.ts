import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalMutation, internalQuery } from '../../lib';

// TODO: create preemptively when onboarding user
export const _createPreferences = internalMutation({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		return await ctx.db.insert('user_preferences', { owner: userId });
	},
});

export const _preferencesForUser = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		const preferences = await ctx.db
			.query('user_preferences')
			.withIndex('by_owner', (q) => q.eq('owner', userId))
			.first();

		if (!preferences) throw new Error('Preferences not found');

		return preferences;
	},
});

export const _updateUserInstructions = internalMutation({
	args: {
		userId: zid('users'),
		instructions: z.string(),
	},
	handler: async (ctx, { userId, instructions }) => {
		//
		const existing = await _preferencesForUser(ctx, { userId });

		await ctx.db.patch(existing._id, { instructions });
	},
});
