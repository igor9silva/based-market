'use node';

import { zid } from 'convex-helpers/server/zod';
import { internal } from './_generated/api';
import { internalAction } from './lib';
import { _scheduleNextActionIfNeeded, _sendMeseeksMessage, _setActionStatus } from './taskActions';

export const _run = internalAction({
	args: {
		userId: zid('users'),
		taskId: zid('tasks'),
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		await _setActionStatus(ctx, { status: 'running', actionId });

		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		try {
			// invoke magic rock
			// const { result } = await SPELLS[action.kind](ctx, task, action);

			// TODO: do the magic
			const result = 'test';

			await _sendMeseeksMessage(ctx, { taskId: task._id, message: result });
			await _setActionStatus(ctx, { status: 'succeeded', actionId });
			await _scheduleNextActionIfNeeded(ctx, { taskId, userId });
			//
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			await _sendMeseeksMessage(ctx, { taskId: task._id, message: errorMessage });
			await _setActionStatus(ctx, { status: 'failed', actionId });

			throw error;
		}
	},
});
