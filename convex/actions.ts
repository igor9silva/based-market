import { zid } from 'convex-helpers/server/zod';
import { internalQuery } from './lib';
import { actionOwnerSchema } from './schemas/actionSchema';

// Exposed -------------------------------------

// Internal (no authorization)------------------------------------

// all global actions + all user-defined actions
export const _findAll = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		const [globals, users] = await Promise.all([
			_findAllByOwner(ctx, { owner: 'built-in' }), // global actions
			_findAllByOwner(ctx, { owner: userId }), // user-defined actions
		]);

		return globals.concat(users);
	},
});

export const _findAllByOwner = internalQuery({
	args: {
		owner: actionOwnerSchema,
	},
	handler: async (ctx, { owner }) => {
		//
		return await ctx.db
			.query('actions')
			.withIndex('by_owner', (q) => q.eq('owner', owner))
			.collect();
	},
});

// Helper functions ------------------------------------
