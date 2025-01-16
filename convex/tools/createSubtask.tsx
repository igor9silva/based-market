import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Create a subtask',
	parameters: z.object({
		body: z.string().describe('The initial task content. MDX-compatible.'),
	}),
};

export const createSubtask = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	operation?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!operation) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ body }) => {
			//
			const id = await ctx.runMutation(internal.tasks._add, {
				parentId: task._id,
				userId: task.owner,
				body,
			});

			return `Subtask created (${id}).`;
		},
	});
};
