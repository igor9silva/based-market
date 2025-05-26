import { mutation } from '../lib';
import { gameKindsSchema } from '../schemas/gameSchema';

export const start = mutation({
	args: {
		kind: gameKindsSchema,
	},
	handler: async (ctx, { kind }) => {
		//
		return await ctx.db.insert('games', {
			kind,
			status: 'running',
		});
	},
});
