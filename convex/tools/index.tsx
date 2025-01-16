import { zid } from 'convex-helpers/server/zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { internalAction, internalQuery } from '../lib';
import { _runNextOperationIfNeeded, _setOperationStatus } from '../operations';
import { authorSchema } from '../schemas/authorSchema';
import { toolOwnerSchema } from '../schemas/toolSchema';
import { createHttpTool } from './createHttpTool';
import { createSubtask } from './createSubtask';
import { doNothing } from './doNothing';
import { markAsDone } from './markAsDone';
import { moveTask } from './moveTask';
import { searchTasks } from './searchTasks';
import { sendMessage } from './sendMessage';
import { updateTask } from './updateTask';

// Exposed -------------------------------------

// Internal (no authorization)------------------------------------

// all global tools + all user-defined tools
export const _findAll = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		const [globals, users] = await Promise.all([
			_findAllByOwner(ctx, { owner: 'built-in' }), // global tools
			_findAllByOwner(ctx, { owner: userId }), // user-defined tools
		]);

		return globals.concat(users);
	},
});

export const _findAllByOwner = internalQuery({
	args: {
		owner: toolOwnerSchema,
	},
	handler: async (ctx, { owner }) => {
		//
		return await ctx.db
			.query('tools')
			.withIndex('by_owner', (q) => q.eq('owner', owner))
			.collect();
	},
});

// Helper functions ------------------------------------

// TODO: move to DB
export const coreTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	operation?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	//
	const tools = await ctx.runQuery(internal.tools.index._findAll, { userId: task.owner });

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

		...tools.reduce(
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
