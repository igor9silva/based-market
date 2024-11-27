import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { ActionCtx } from '../_generated/server';
import { _updateArgs } from '../tasks';

export default (ctx: ActionCtx) =>
	tool({
		description: 'Update the task with improved title and body',
		parameters: z.object(_updateArgs),
		execute: async ({ taskId, title, body }) => {
			//
			await ctx.runMutation(internal.tasks._update, {
				taskId,
				title,
				body,
				author: 'meseeks',
			});

			return 'Task updated';
		},
	});
