// import { zid } from 'convex-helpers/server/zod';
// import { z } from 'zod';
// import { mutation, query } from '../lib';
// import { ensureTaskAuthor } from '../tasks/public';
// import { _decide, _findAll, _findOne, _say, _useTool } from './private';

// export const skip = mutation({
// 	args: {
// 		actionId: zid('actions'),
// 	},
// 	handler: async (ctx, { actionId }) => {
// 		//
// 		const action = await ctx.db.get(actionId);
// 		if (!action) throw new Error('Action not found');

// 		const { currentUser } = await ensureTaskAuthor(ctx, { taskId: action.taskId });

// 		// skip is only allowed for pending or failed actions
// 		if (action.status !== 'pending' && action.status !== 'failed') {
// 			throw new Error(`Cannot skip ${action.status} actions`);
// 		}

// 		await _setStatus(ctx, { actionId, status: 'skipped' });
// 		// TODO: add event
// 		await _runNextActionIfNeeded(ctx, { taskId: action.taskId, author: currentUser._id });
// 	},
// });

// /**
//  * Helper function to find task actions for a given task and status.
//  * This is purely for ergonomics to avoid repeating the query logic.
//  *
//  * @param ctx The query context
//  * @param args.taskId The ID of the task to find actions for
//  * @param args.status The status to filter the actions by
//  * @returns A query builder for task actions filtered by task and status
//  */
// function isStatusDone(status: z.infer<typeof actionStatusSchema>) {
// 	return status === 'succeeded' || status === 'failed' || status === 'skipped';
// }
