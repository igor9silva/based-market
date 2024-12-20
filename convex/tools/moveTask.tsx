import { tool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Move the task to a new parent',
	parameters: z.object({
		newParentId: zid('tasks')
			.optional()
			.describe('The new parent id for the task. If not provided, the task will be moved to the Inbox.'),
	}),
};

export const moveTask = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'taskActions'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ newParentId }) => {
			//
			await ctx.runMutation(internal.tasks._move, {
				taskId: task._id,
				newParentId,
				author: action._id,
			});

			return 'Task updated';
		},
	});
};
