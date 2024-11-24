import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

export default (ctx: ActionCtx) =>
	tool({
		description: 'Update the task with improved title and body',
		// TODO: think about how to use the same schema (v.())
		parameters: z.object({
			taskId: z.string(),
			title: z.string().describe('The improved title for the task'),
			body: z.string().describe('The improved body/description for the task'),
		}),
		execute: async ({ taskId, title, body }) => {
			//
			await ctx.runMutation(internal.tasks._update, {
				taskId: taskId as Id<'tasks'>,
				title,
				body,
				author: 'meseeks',
			});

			return 'Task updated';
		},
	});
