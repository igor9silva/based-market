import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { mutation, query } from '../lib';
import { current as getCurrentUser } from '../users/public';
import { _add, _markAsDone, _move, _update } from './private';

export const findAllAtInbox = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const find = ({ isDone }: { isDone: boolean }) =>
			ctx.db
				.query('tasks')
				.withIndex('by_owner_parentId_isDone', (q) =>
					q
						.eq('owner', currentUser._id) //
						.eq('parentId', undefined)
						.eq('isDone', isDone),
				)
				.order('desc')
				.collect();

		const [notDone, done] = await Promise.all([
			find({ isDone: false }), //
			find({ isDone: true }),
		]);

		return notDone.concat(done);
	},
});

export const findAll = query({
	args: {
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { parentId }) => {
		//
		if (!parentId) return await findAllAtInbox(ctx, {});

		await ensureTaskOwner(ctx, { taskId: parentId });

		const find = ({ isDone }: { isDone: boolean }) =>
			ctx.db
				.query('tasks')
				.withIndex('by_parent_isDone', (q) =>
					q
						.eq('parentId', parentId) //
						.eq('isDone', isDone),
				)
				.order('desc')
				.collect();

		const [notDone, done] = await Promise.all([
			find({ isDone: false }), //
			find({ isDone: true }),
		]);

		return notDone.concat(done);
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

export const findOneOrNot = query({
	args: {
		taskId: zid('tasks').optional(),
	},
	handler: async (ctx, { taskId }) => {
		//
		if (!taskId) return undefined;

		const { task } = await ensureTaskOwner(ctx, { taskId });

		return task;
	},
});

export const add = mutation({
	args: {
		body: z.optional(z.string()),
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { body, parentId }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});
		return await _add(ctx, { userId: currentUser._id, body, parentId });
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

export const move = mutation({
	args: {
		taskId: zid('tasks'),
		newParentId: zid('tasks').optional(),
	},
	handler: async (ctx, { taskId, newParentId }) => {
		//
		const { task, currentUser } = await ensureTaskOwner(ctx, { taskId });

		if (newParentId) {
			// ensure we also have permission on the new parent
			await ensureTaskOwner(ctx, { taskId: newParentId });
		}

		if (task.parentId === newParentId) {
			throw new Error('Task is already in this list.');
		}

		await _move(ctx, { taskId, newParentId, author: currentUser._id });
	},
});

export const ensureTaskOwner = async (ctx: QueryCtx | MutationCtx, args: { taskId: Id<'tasks'> }) => {
	//
	const currentUser = await getCurrentUser(ctx, {});
	const task = await ctx.db.get(args.taskId);

	if (!task) throw new Error('Task not found');
	if (task.owner !== currentUser._id) throw new Error('Task not found'); // purposefully do not mention authorization

	return { currentUser, task };
};
