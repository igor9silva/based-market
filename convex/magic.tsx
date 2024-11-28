'use node';

import { zid } from 'convex-helpers/server/zod';
import { internal } from './_generated/api';
import { Doc } from './_generated/dataModel';
import { ActionCtx } from './_generated/server';
import { internalAction } from './lib';
import KNOWN_SPELLS, { genericSpell } from './spells';
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
			const result = await invokeMagicRock(ctx, task, action);

			if (result.length > 0) {
				await _sendMeseeksMessage(ctx, { taskId: task._id, message: result });
			}

			await _setActionStatus(ctx, { status: 'succeeded', actionId });
			await _scheduleNextActionIfNeeded(ctx, { taskId, userId });
			//
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			console.error('error in magic', errorMessage); // TODO: alert

			await _sendMeseeksMessage(ctx, { taskId: task._id, message: errorMessage });
			await _setActionStatus(ctx, { status: 'failed', actionId });

			throw error;
		}
	},
});

async function invokeMagicRock(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) {
	switch (action.kind) {
		case 'message':
			if (action.message in KNOWN_SPELLS) {
				const spell = KNOWN_SPELLS[action.message as keyof typeof KNOWN_SPELLS];
				return await spell(ctx, task, action);
			} else {
				return await genericSpell(ctx, task, action);
			}
		case 'mutation':
			return 'TODO: handle mutations'; // TODO: do the magic
		default:
			throw new Error(`Unknown action kind`);
	}
}
