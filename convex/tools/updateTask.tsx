import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

export default (ctx: ActionCtx, taskId: Id<'tasks'>) =>
	tool({
		description: 'Update the task with improved title and body',
		parameters: z.object({
			title: z.string().optional().describe('The improved title for the task'),
			body: z.string().optional().describe('The improved body/description for the task'),
		}),
		execute: async ({ title, body }) => {
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
