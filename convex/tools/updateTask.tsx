import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Update the task with improved title and body',
	parameters: z.object({
		title: z.string().optional().describe('The improved title for the task'),
		body: z.string().optional().describe('The improved body/description for the task'),
	}),
};

export const updateTask = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ title, body }) => {
			//
			// TODO: review authorization for all mutation tools - Meseeks should inherit it's user's permissions
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
