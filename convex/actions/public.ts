import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { ensureTaskOwner } from '../tasks/public';
import { _decide, _findAll, _findOne, _say, _useTool } from './private';

export const say = mutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
	},
	handler: async (ctx, { taskId, message }) => {
		//
		console.debug(`say '${message}' on task '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		return await _say(ctx, {
			message,
			taskId,
			author: currentUser._id,
		});
	},
});

export const useTool = mutation({
	args: {
		taskId: zid('tasks'),
		key: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, key, args }) => {
		//
		console.debug(`use tool on task '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		return await _useTool(ctx, {
			key,
			args,
			taskId,
			author: currentUser._id,
		});
	},
});

export const decide = mutation({
	args: {
		taskId: zid('tasks'),
		key: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, key, args }) => {
		//
		console.debug(`decide on task '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		return await _decide(ctx, {
			key,
			args,
			taskId,
			author: currentUser._id,
		});
	},
});

// ------------------------------------

export const findAll = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskOwner(ctx, { taskId });
		return await _findAll(ctx, { taskId });
	},
});

export const findOne = query({
	args: {
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await _findOne(ctx, { actionId });

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		return action;
	},
});

// ------------------------------------

export const skip = mutation({
	args: {
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		const { currentUser } = await ensureTaskOwner(ctx, { taskId: action.taskId });

		// skip is only allowed for pending or failed actions
		if (action.status !== 'pending' && action.status !== 'failed') {
			throw new Error(`Cannot skip ${action.status} actions`);
		}

		await _setStatus(ctx, { actionId, status: 'skipped' });
		// TODO: add event
		await _runNextActionIfNeeded(ctx, { taskId: action.taskId, author: currentUser._id });
	},
});

// export const retry = mutation({
// 	args: {
// 		actionId: zid('actions'),
// 	},
// 	handler: async (ctx, { actionId }) => {
// 		//
// 		const action = await ctx.db.get(actionId);
// 		if (!action) throw new Error('Action not found');

// 		const { currentUser } = await ensureTaskOwner(ctx, { taskId: action.taskId });

// 		// retry is only allowed for failed actions
// 		if (action.status !== 'failed') throw new Error(`Cannot retry ${action.status} actions`);

// 		await _runAction(ctx, {
// 			taskId: action.taskId,
// 			actionId,
// 			author: currentUser._id,
// 			actionKind: action.kind,
// 		});
// 		// TODO: add event
// 	},
// });

/**
 * Helper function to find task actions for a given task and status.
 * This is purely for ergonomics to avoid repeating the query logic.
 *
 * @param ctx The query context
 * @param args.taskId The ID of the task to find actions for
 * @param args.status The status to filter the actions by
 * @returns A query builder for task actions filtered by task and status
 */
function isStatusDone(status: z.infer<typeof actionStatusSchema>) {
	return status === 'succeeded' || status === 'failed' || status === 'skipped';
}
