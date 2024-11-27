import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx } from './_generated/server';
import { internalMutation, internalQuery, mutation, query } from './lib';
import { authorSchema } from './schema';
import { _addTaskAddEvent, _addTaskMarkAsDoneEvent, _addTaskUpdateEvent } from './taskEvents';
import { current as getCurrentUser } from './users.js';

// Exposed ------------------------------------

export const findAll = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await ctx.db
			.query('tasks')
			.withIndex('by_owner_isDone', (q) => q.eq('owner', currentUser._id))
			.collect();
	},
});

export const findOne = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		const { task } = await ensureTaskOwner(ctx, { taskId });
		return task;
	},
});

export const add = mutation({
	args: {
		title: z.string(),
		body: z.optional(z.string()),
	},
	handler: async (ctx, { title, body }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});
		const taskId = await ctx.db.insert('tasks', { title, body, owner: currentUser._id, isDone: false });
		await _addTaskAddEvent(ctx, { taskId, author: currentUser._id });

		return taskId;
	},
});

export const update = mutation({
	args: {
		taskId: zid('tasks'),
		title: z.optional(z.string()),
		body: z.optional(z.string()),
	},
	handler: async (ctx, { taskId, title, body }) => {
		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		return _update(ctx, { taskId, title, body, author: currentUser._id });
	},
});

export const markAsDone = mutation({
	args: {
		taskId: zid('tasks'),
		isDone: z.boolean(),
	},
	handler: async (ctx, { taskId, isDone }) => {
		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		await ctx.db.patch(taskId, { isDone });
		await _addTaskMarkAsDoneEvent(ctx, { taskId, author: currentUser._id, isDone });
	},
});

// Internal (no authorization) ------------------------------------

export const _findOne = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const task = await ctx.db.get(taskId);
		if (!task) throw new Error('Task not found');

		return task;
	},
});

export const _updateArgs = {
	taskId: zid('tasks'),
	title: z.string().optional().describe('The improved title for the task'),
	body: z.string().optional().describe('The improved body/description for the task'),
};

export const _update = internalMutation({
	args: {
		..._updateArgs,
		author: authorSchema,
	},
	handler: async (ctx, { taskId, title, body, author }) => {
		//
		await ctx.db.patch(taskId, {
			...(title !== undefined && { title }),
			...(body !== undefined && { body }),
		});

		await _addTaskUpdateEvent(ctx, { taskId, author, changes: 'TODO: not implemented yet' });
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
