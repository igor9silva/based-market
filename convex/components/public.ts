import { z } from 'zod';
import { query } from '../lib';
import { current as getCurrentUser } from '../users/public';

export const findOneBySlug = query({
	args: {
		slug: z.string(),
	},
	handler: async (ctx, { slug }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const page = await ctx.db
			.query('components')
			.withIndex('by_owner_slug', (q) =>
				q
					.eq('owner', currentUser._id) //
					.eq('slug', slug),
			)
			.unique();

		if (!page) throw new Error('Component not found');

		return page;
	},
});
