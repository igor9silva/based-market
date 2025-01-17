import { zid } from 'convex-helpers/server/zod';
import { internal } from '../../_generated/api';
import { Doc } from '../../_generated/dataModel';
import { _runNextActionIfNeeded, _setActionStatus } from '../../actions/private';
import { internalAction } from '../../lib';
import { authorSchema } from '../../schemas/authorSchema';
import { _allTools } from './queries';

export const _execute = internalAction({
	args: {
		author: authorSchema,
		taskId: zid('tasks'),
		actionId: zid('actions'),
	},
	handler: async (ctx, { taskId, actionId, author }) => {
		//
		// make sure the action is a tool
		const action = await ctx.runQuery(internal.actions.private._findOne, { actionId });
		if (!isToolAction(action)) throw new Error('Expected a tool action.');

		// grab the task
		const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });

		const availableTools = await _allTools(ctx, task, action);
		const tool = availableTools[action.key as keyof typeof availableTools];

		try {
			//
			if (!tool) throw new Error(`Unknown tool: ${action.key}`);

			const parsedArgs = tool.parameters.safeParse(action.args);
			if (!parsedArgs.success) throw new Error(`Invalid tool args: ${parsedArgs.error.message}`);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool
			const result = await tool.execute(parsedArgs.data);

			await ctx.runMutation(internal.actions.private._setToolCallResult, {
				actionId,
				result,
			});

			await _setActionStatus(ctx, { status: 'succeeded', actionId });
			await _runNextActionIfNeeded(ctx, { taskId, author });
			//
		} catch (error) {
			//
			console.error('error in tool', error); // TODO: notify

			await _setActionStatus(ctx, { status: 'failed', actionId });

			await ctx.runMutation(internal.actions.private._setToolCallResult, {
				actionId,
				result: `${action.key} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				isError: true,
			});

			throw error;
		}
	},
});

function isToolAction(action: Doc<'actions'>): action is Doc<'actions'> & { kind: 'tool' } {
	return action.kind === 'tool';
}
