'use node';

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import SPELLS from './spells';
import { _scheduleNextActionIfNeeded, _setActionStatus } from './taskActions';
import { _addTaskEvent } from './taskEvents';

export const _run = internalAction({
	args: {
		userId: v.id('users'),
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		// set action as 'running'
		await _setActionStatus(ctx, { actionId, status: 'running' });

		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		try {
			// invoke magic rock
			await SPELLS[action.kind](ctx, task, action);
			//
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// TODO: notify errors

			// set action as 'failed'
			await _setActionStatus(ctx, { actionId, status: 'failed', errorMessage });

			await _addTaskEvent(ctx, {
				actionId: action._id,
				actionKind: action.kind,
				taskId: task._id,
				author: 'meseeks',
				error: errorMessage,
				result: null,
				kind: 'actionResult',
			});

			throw error;
		}

		// set action as 'succeeded'
		await _setActionStatus(ctx, { actionId, status: 'succeeded' });

		// schedule next action
		await _scheduleNextActionIfNeeded(ctx, { taskId, userId });

		// TODO: log/persist events
	},
});
