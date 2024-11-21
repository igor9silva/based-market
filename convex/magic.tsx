'use node';

import { v } from 'convex/values';
import { internal } from './_generated/api';
import { internalAction } from './_generated/server';
import SPELLS from './spells';
import { scheduleNextActionIfNeeded, setActionStatus } from './taskActions';

export const run = internalAction({
	args: {
		userId: v.id('users'),
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		// set action as 'running'
		await setActionStatus(ctx, { actionId, status: 'running' });

		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		// invoke magic rock
		try {
			await SPELLS[action.kind](ctx, task, action);
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			// TODO: notify errors

			// set action as 'failed'
			await setActionStatus(ctx, { actionId, status: 'failed', errorMessage });

			await ctx.runMutation(internal.taskEvents.addActionResultError, {
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
		await setActionStatus(ctx, { actionId, status: 'succeeded' });

		// schedule next action
		await scheduleNextActionIfNeeded(ctx, { taskId, userId });

		// TODO: log/persist events
	},
});
