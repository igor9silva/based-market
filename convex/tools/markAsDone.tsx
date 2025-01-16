import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Mark the task as done or undone.',
	parameters: z.object({
		isDone: z.boolean().describe('Whether the task should be marked as done or undone.'),
	}),
};

export const markAsDone = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'> & { kind: 'tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ isDone }) => {
			//
			await ctx.runMutation(internal.tasks._markAsDone, {
				taskId: task._id,
				author: action._id,
				isDone,
			});

			return `Marked as ${isDone ? 'done' : 'not done'}.`;
		},
	});
};
