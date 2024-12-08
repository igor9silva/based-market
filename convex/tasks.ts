import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx } from './_generated/server';
import { internalMutation, internalQuery, mutation, query } from './lib';
import { authorSchema } from './schemas/authorSchema';
import { _reportMutation } from './taskEvents';
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
		title: z.optional(z.string()),
		body: z.optional(z.string()),
	},
	handler: async (ctx, { title, body }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});
		const taskId = await ctx.db.insert('tasks', { title, body, owner: currentUser._id, isDone: false });

		await _reportMutation(ctx, { taskId, changes: 'Added this task.', author: currentUser._id });

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
		//
		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		await _markAsDone(ctx, { taskId, isDone, author: currentUser._id });
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

export const _update = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		title: z.string().optional(),
		body: z.string().optional(),
	},
	handler: async (ctx, { taskId, title, body, author }) => {
		//
		await ctx.db.patch(taskId, {
			...(title !== undefined && { title }),
			...(body !== undefined && { body }),
		});

		const updatedFields = [title !== undefined && 'title', body !== undefined && 'body'].filter(Boolean);

		const changes = updatedFields.length ? `Updated ${updatedFields.join(' and ')}.` : 'No fields were updated.';

		await _reportMutation(ctx, { taskId, changes, author });
	},
});

export const _markAsDone = internalMutation({
	args: {
		taskId: zid('tasks'),
		isDone: z.boolean(),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, isDone, author }) => {
		//
		await ctx.db.patch(taskId, { isDone });

		const changes = isDone ? 'Marked as done.' : 'Marked as not done.';
		await _reportMutation(ctx, { taskId, changes, author });
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
