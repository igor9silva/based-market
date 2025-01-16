import { tool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Move the task to a new parent',
	parameters: z.object({
		taskId: zid('tasks').describe('The task id to be moved.'),
		newParentId: z
			.union([
				zid('tasks'), //
				z.literal('inbox'),
			])
			.describe(
				'The new parent id for the task. Use "inbox" to move the task to the Inbox (aka root, no parent).',
			),
	}),
};

export const moveTask = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'> & { kind: 'tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ taskId, newParentId }) => {
			//
			await ctx.runMutation(internal.tasks._move, {
				taskId,
				newParentId: newParentId === 'inbox' ? undefined : newParentId,
				author: action._id,
			});

			return 'Task updated';
		},
	});
};
