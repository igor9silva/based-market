import { tool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import { Doc } from '../../_generated/dataModel';
import { ActionCtx } from '../../_generated/server';
import { internalQuery } from '../../lib';
import { toolOwnerSchema } from '../../schemas/toolSchema';
import { createHttpTool } from './createHttpTool';

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

export const _allTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'> & { kind: 'tool' },
) => ({
	..._mutationTools(ctx, task, action),
	..._httpTools(ctx, task, action),
	// ...decisionTools(ctx, task, action),
});

const _mutationTools = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'> & { kind: 'tool' },
) => ({
	doNothing: tool({
		description: 'Do nothing.',
		parameters: z.object({}),
		execute: () => Promise.resolve(console.log('did nothing')),
	}),
	say: tool({
		description: 'Send a text message to the user.',
		parameters: z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		// prettier-ignore
		execute: (args) => { throw new Error('Idk what to do here yet') },
	}),
	updateTask: tool({
		description: 'Update the task',
		parameters: z.object({
			title: z.string().optional().describe('The improved title for the task'),
			body: z.string().optional().describe('The improved body/description for the task'),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._update, {
			taskId: task._id,
			author: action._id,
			...args,
		}),
	}),
	markAsDone: tool({
		description: 'Mark the task as done or undone.',
		parameters: z.object({
			isDone: z.boolean().describe('Whether the task should be marked as done or undone.'),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._markAsDone, {
			taskId: task._id,
			author: action._id,
			...args,
		}),
	}),
	moveTask: tool({
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
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._move, {
			taskId: args.taskId,
			author: action._id,
			newParentId: args.newParentId === 'inbox' ? undefined : args.newParentId,
		}),
	}),
	createSubtask: tool({
		description: 'Create a subtask',
		parameters: z.object({
			body: z.string().describe('The first user message content in MDX format.'),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._add, {
			parentId: task._id,
			userId: task.owner,
			body: args.body,
		}),
	}),
});

const _httpTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'> & { kind: 'tool' },
) => {
	const tools = await ctx.runQuery(internal.tools.private.queries._findAll, {
		userId: task.owner,
	});

	return toMap(tools, (tool) => createHttpTool(ctx, task, action, tool));
};

const decisionTools = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'> & { kind: 'tool' },
) => {
	throw new Error('TODO: implement decision tools');
};

function toMap<T>(
	tools: Doc<'tools'>[], //
	mapFn: (tool: Doc<'tools'>) => T,
) {
	return tools.reduce(
		(acc, tool) => {
			acc[tool.key] = mapFn(tool);
			return acc;
		},
		{} as Record<string, T>,
	);
}
