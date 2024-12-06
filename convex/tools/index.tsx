'use node';

import { zid } from 'convex-helpers/server/zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { internalAction } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { _runNextActionIfNeeded, _setActionStatus } from '../taskActions';
import { checkFact } from './checkFact';
import { doNothing } from './doNothing';
import { markAsDone } from './markAsDone';
import { scrapeLink } from './scrapeLink';
import { sendMessage } from './sendMessage';
import { updateTask } from './updateTask';

// TODO: move to DB
export const coreTools = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'taskActions'> & { kind: 'run-tool' },
) => ({
	sendMessage: sendMessage(ctx, task, action),
	doNothing: doNothing(ctx, task, action),
	updateTask: updateTask(ctx, task, action),
	markAsDone: markAsDone(ctx, task, action),
	// fillTask: fillTask(ctx, task, action),
	// minifyDescription: minifyDescription(ctx, task, action),
	scrapeLink: scrapeLink(ctx, task, action),
	checkFact: checkFact(ctx, task, action),
});

// TODO: a more robust one
export const promptForTask = (task: Doc<'tasks'>) =>
	[
		`<id>${task._id}</id>`, //
		`<title>${task.title}</title>`,
		`<body>${task.body}</body>`,
		`<createdAt>${new Date(task._creationTime).toISOString()}</createdAt>`,
	].join('\n');

export const _run = internalAction({
	args: {
		author: authorSchema,
		taskId: zid('tasks'),
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, author }) => {
		//
		// make sure the action is a tool call
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });
		if (action.kind !== 'run-tool') throw new Error('Expected a tool call action.');

		// grab the task
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });

		try {
			//
			const availableTools = coreTools(ctx, task, action);
			const tool = availableTools[action.toolName as keyof typeof availableTools];

			if (!tool) throw new Error(`Unknown tool: ${action.toolName}`);

			const parsedArgs = tool.parameters.safeParse(action.args);
			if (!parsedArgs.success) throw new Error(`Invalid tool args: ${parsedArgs.error.message}`);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool
			const result = await tool.execute(parsedArgs.data);

			await ctx.runMutation(internal.taskEvents._setToolCallResult, {
				eventId: action.origin,
				result,
			});

			await _setActionStatus(ctx, { status: 'succeeded', actionId });
			await _runNextActionIfNeeded(ctx, { taskId, author });
			//
		} catch (error) {
			//
			console.error('error in tool', error); // TODO: notify

			await ctx.runMutation(internal.taskEvents._setToolCallResult, {
				eventId: action.origin,
				result: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				isError: true,
			});

			await _setActionStatus(ctx, { status: 'failed', actionId });

			throw error;
		}
	},
});
