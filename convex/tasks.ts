import { v } from 'convex/values';
import { Id } from './_generated/dataModel';
import { internalMutation, internalQuery, mutation, MutationCtx, query, QueryCtx } from './_generated/server.js';
import { current as getCurrentUser } from './users.js';

// Exposed ------------------------------------

export const findAll = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await ctx.db
			.query('tasks')
			.withIndex('by_owner', (q) => q.eq('owner', currentUser._id))
			.collect();
	},
});

export const findOne = query({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		const { task } = await ensureTaskOwner(ctx, { taskId });
		return task;
	},
});

export const add = mutation({
	args: {
		title: v.string(),
		body: v.string(),
		owner: v.id('users'),
	},
	handler: async (ctx, { title, body, owner }) => {
		//
		const taskId = await ctx.db.insert('tasks', { title, body, owner });

		return taskId;
	},
});

export const update = mutation({
	args: {
		taskId: v.id('tasks'),
		title: v.string(),
		body: v.string(),
	},
	handler: async (ctx, { taskId, title, body }) => {
		await ensureTaskOwner(ctx, { taskId });
		return ctx.db.patch(taskId, { title, body });
	},
});

// Internal (no authorization) ------------------------------------

export const _findOne = internalQuery({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const task = await ctx.db.get(taskId);
		if (!task) throw new Error('Task not found');

		return task;
	},
});

export const _update = internalMutation({
	args: {
		taskId: v.id('tasks'),
		title: v.optional(v.string()),
		body: v.optional(v.string()),
	},
	handler: async (ctx, { taskId, title, body }) => {
		//
		return ctx.db.patch(taskId, {
			...(title !== undefined && { title }),
			...(body !== undefined && { body }),
		});
	},
});

// Helper functions ------------------------------------

export const ensureTaskOwner = async (ctx: QueryCtx | MutationCtx, args: { taskId: Id<'tasks'> }) => {
	//
	const currentUser = await getCurrentUser(ctx, {});
	const task = await ctx.db.get(args.taskId);

	if (!task) throw new Error('Task not found');
	if (task.owner !== currentUser._id) throw new Error('Task not found'); // purposefully do not mention authorization

	return { currentUser, task };
};
