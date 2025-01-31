import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { mutation, query } from '../lib';
import { current as getCurrentUser } from '../users/public';
import { _add } from './private';

export const findAll = query({
	args: {
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { parentId }) => {
		//
		if (!parentId) return await findAllAtInbox(ctx, {});

		await ensureTaskAuthor(ctx, { taskId: parentId });

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

export const findAllAtInbox = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const find = ({ isDone }: { isDone: boolean }) =>
			ctx.db
				.query('tasks')
				.withIndex('by_author_parentId_isDone', (q) =>
					q
						.eq('author', currentUser._id) //
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

export const findOne = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		const { task } = await ensureTaskAuthor(ctx, { taskId });
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

		return await findOne(ctx, { taskId });
	},
});

export const add = mutation({
	args: {
		body: z.string(),
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { body, parentId }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await _add(ctx, { userId: currentUser._id, body, parentId });
	},
});

export const ensureTaskAuthor = async (
	ctx: QueryCtx | MutationCtx, //
	args: {
		taskId: Id<'tasks'>;
	},
) => {
	//
	const currentUser = await getCurrentUser(ctx, {});
	const task = await ctx.db.get(args.taskId);

	if (!task) throw new Error('Task not found');
	if (task.author !== currentUser._id) throw new Error('Task not found'); // purposefully do not mention authorization

	return { currentUser, task };
};
