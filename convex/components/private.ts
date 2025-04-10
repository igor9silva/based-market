import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalMutation, internalQuery } from '../lib';
import { componentSchema } from '../schemas/componentSchema';

export const _add = internalMutation({
	args: {
		...componentSchema.shape,
	},
	handler: async (ctx, { owner, body, defaultTaskId, slug }) => {
		//
		return await ctx.db.insert('components', {
			owner,
			body,
			defaultTaskId,
			slug,
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
			.query('components')
			.withIndex('by_owner_slug', (q) => q.eq('owner', userId))
			.collect();
	},
});

export const _findOneBySlug = internalQuery({
	args: {
		slug: z.string(),
		userId: zid('users'),
	},
	handler: async (ctx, { slug, userId }) => {
		//
		const users = await ctx.db
			.query('components')
			.withIndex('by_owner_slug', (q) => q.eq('owner', userId).eq('slug', slug))
			.unique();

		if (users) return users;

		const globals = await ctx.db
			.query('components')
			.withIndex('by_owner_slug', (q) => q.eq('owner', 'isPro').eq('slug', slug))
			.unique();

		return globals;
	},
});
