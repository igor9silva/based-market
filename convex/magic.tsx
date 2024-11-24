'use node';

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import SPELLS from './spells';
import { _scheduleNextActionIfNeeded, _setActionStatus } from './taskActions';
import { _addActionErrorEvent, _addActionResultEvent } from './taskEvents';

export const _run = internalAction({
	args: {
		userId: v.id('users'),
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		await _setActionStatus(ctx, { actionId, status: 'running' });

		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		try {
			// invoke magic rock
			const { result } = await SPELLS[action.kind](ctx, task, action);

			await _setActionStatus(ctx, { actionId, status: 'succeeded' });
			await _scheduleNextActionIfNeeded(ctx, { taskId, userId });
			await _addActionResultEvent(ctx, { taskId: task._id, action, result });
			//
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			await _setActionStatus(ctx, { status: 'failed', actionId, errorMessage });
			await _addActionErrorEvent(ctx, { taskId: task._id, action, error: errorMessage });

			throw error;
		}
	},
});
