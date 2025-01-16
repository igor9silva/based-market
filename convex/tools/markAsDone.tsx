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
	operation?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!operation) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ isDone }) => {
			//
			await ctx.runMutation(internal.tasks._markAsDone, {
				taskId: task._id,
				author: operation._id,
				isDone,
			});

			return `Marked as ${isDone ? 'done' : 'not done'}.`;
		},
	});
};
