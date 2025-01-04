import { zid } from 'convex-helpers/server/zod';
import { internalQuery } from './lib';
import { toolOwnerSchema } from './schemas/httpToolSchema';

// Exposed -------------------------------------

// Internal (no authorization)------------------------------------

// all global tools + all user-defined tools
export const _findAll = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		return Promise.all([
			_findAllByOwner(ctx, { owner: 'built-in' }), // global tools
			_findAllByOwner(ctx, { owner: userId }), // user-defined tools
		]).then(([global, users]) => global.concat(users));
	},
});

export const _findAllByOwner = internalQuery({
	args: {
		owner: toolOwnerSchema,
	},
	handler: async (ctx, { owner }) => {
		//
		return await ctx.db
			.query('httpTools')
			.withIndex('by_owner', (q) => q.eq('owner', owner))
			.collect();
	},
});

// Helper functions ------------------------------------
