import { zid } from 'convex-helpers/server/zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { _runNextActionIfNeeded, _setActionStatus } from '../actions';
import { internalAction, internalQuery } from '../lib';
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
	action?: Doc<'actions'> & { kind: 'tool' },
) => {
	//
	const tools = await ctx.runQuery(internal.tools.index._findAll, { userId: task.owner });

	return {
		// built-in actions
		updateTask: updateTask(ctx, task, action), // TODO: split into title and body?
		markAsDone: markAsDone(ctx, task, action),
		moveTask: moveTask(ctx, task, action),
		createSubtask: createSubtask(ctx, task, action),
		searchTasks: searchTasks(ctx, task, action),
		sendMessage: sendMessage(ctx, task, action),
		doNothing: doNothing(ctx, task, action),
		// fillTask: fillTask(ctx, task, action),
		// minifyDescription: minifyDescription(ctx, task, action),
		// scrapeLink: scrapeLink(ctx, task, action),
		// checkFact: checkFact(ctx, task, action),

		...tools.reduce(
			(acc, tool) => {
				acc[tool.key] = createHttpTool(ctx, task, action, tool);
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

function isToolAction(action: Doc<'actions'>): action is Doc<'actions'> & { kind: 'tool' } {
	return action.kind === 'tool';
}

export const _run = internalAction({
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

		const availableTools = await coreTools(ctx, task, action);
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
