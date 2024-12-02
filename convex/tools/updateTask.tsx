import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

export const updateTask = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) => {
	return tool({
		description: 'Update the task with improved title and body',
		parameters: z.object({
			title: z.string().optional().describe('The improved title for the task'),
			body: z.string().optional().describe('The improved body/description for the task'),
		}),
		execute: async ({ title, body }) => {
			//
			await ctx.runMutation(internal.tasks._update, {
				taskId: task._id,
				title,
				body,
				author: action._id,
			});

			return 'Task updated';
		},
	});
};
