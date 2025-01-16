import { zid } from 'convex-helpers/server/zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { internalAction } from '../lib';
import { _runNextOperationIfNeeded, _setOperationStatus } from '../operations';
import { authorSchema } from '../schemas/authorSchema';
import { createHttpTool } from './createHttpTool';
import { createSubtask } from './createSubtask';
import { doNothing } from './doNothing';
import { markAsDone } from './markAsDone';
import { moveTask } from './moveTask';
import { searchTasks } from './searchTasks';
import { sendMessage } from './sendMessage';
import { updateTask } from './updateTask';

// TODO: move to DB
export const coreTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	operation?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	//
	const actions = await ctx.runQuery(internal.actions._findAll, { userId: task.owner });

	return {
		// built-in actions
		updateTask: updateTask(ctx, task, operation), // TODO: split into title and body?
		markAsDone: markAsDone(ctx, task, operation),
		moveTask: moveTask(ctx, task, operation),
		createSubtask: createSubtask(ctx, task, operation),
		searchTasks: searchTasks(ctx, task, operation),
		sendMessage: sendMessage(ctx, task, operation),
		doNothing: doNothing(ctx, task, operation),
		// fillTask: fillTask(ctx, task, operation),
		// minifyDescription: minifyDescription(ctx, task, operation),
		// scrapeLink: scrapeLink(ctx, task, operation),
		// checkFact: checkFact(ctx, task, operation),

		...actions.reduce(
			(acc, tool) => {
				acc[tool.name] = createHttpTool(ctx, task, operation, tool);
				return acc;
			},
			{} as Record<string, ReturnType<typeof createHttpTool>>,
		),
	};
};

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
		operationId: zid('operations'),
	},
	handler: async (ctx, { taskId, operationId, author }) => {
		//
		// make sure the operation is an action
		const operation = await ctx.runQuery(internal.operations._findOne, { operationId });
		if (operation.kind !== 'run-tool') throw new Error('Expected an action operation.');

		// grab the task
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });

		const availableTools = await coreTools(ctx, task, operation);
		const tool = availableTools[operation.toolName as keyof typeof availableTools];

		try {
			//
			if (!tool) throw new Error(`Unknown tool: ${operation.toolName}`);

			const parsedArgs = tool.parameters.safeParse(operation.args);
			if (!parsedArgs.success) throw new Error(`Invalid tool args: ${parsedArgs.error.message}`);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool
			const result = await tool.execute(parsedArgs.data);

			await ctx.runMutation(internal.events._setToolCallResult, {
				eventId: operation.origin,
				result,
			});

			await _setOperationStatus(ctx, { status: 'succeeded', operationId });
			await _runNextOperationIfNeeded(ctx, { taskId, author });
			//
		} catch (error) {
			//
			console.error('error in tool', error); // TODO: notify

			await _setOperationStatus(ctx, { status: 'failed', operationId });

			await ctx.runMutation(internal.events._setToolCallResult, {
				eventId: operation.origin,
				result: `${operation.toolName} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
				isError: true,
			});

			throw error;
		}
	},
});
