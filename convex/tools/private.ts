import { tool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc, Id } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { toolOwnerSchema } from '../schemas/toolSchema';
import { createDecisionTool } from './createDecisionTool';
import { createHttpTool } from './createHttpTool';

// all global tools + all user-defined tools
export const _findAll = internalQuery({
	args: {
		owner: zid('users'),
		kind: z.enum(['decision', 'http']).optional().describe('Filter by tool kind. Grab all if unspecified.'),
	},
	handler: async (ctx, { owner, kind }) => {
		//
		const [globals, users] = await Promise.all([
			_findAllByOwner(ctx, { owner: 'built-in', kind }), // global tools
			_findAllByOwner(ctx, { owner, kind }), // user-defined tools
		]);

		return globals.concat(users);
	},
});

export const _findAllByOwner = internalQuery({
	args: {
		owner: toolOwnerSchema,
		kind: z.enum(['decision', 'http']).optional().describe('Filter by tool kind. Grab all if unspecified.'),
	},
	handler: async (ctx, { owner, kind }) => {
		//
		return await ctx.db
			.query('tools')
			.withIndex('by_owner_kind', (q) =>
				kind
					? q.eq('owner', owner).eq('kind', kind) //
					: q.eq('owner', owner),
			)
			.collect();
	},
});

export const _allTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'>,
) => {
	//
	const tools = await ctx.runQuery(internal.tools.private._findAll, {
		owner: task.owner,
	});

	return {
		...toMap(
			tools.filter((tool) => tool.kind === 'decision'),
			(tool) => createDecisionTool(ctx, task, action, tool),
		),
		...toMap(
			tools.filter((tool) => tool.kind === 'http'),
			(tool) => createHttpTool(ctx, task, action, tool),
		),
		..._mutationTools(ctx, task._id, task.author, task.owner),
		..._syncTools(ctx, task._id, task.author, task.owner),
	};
};

export const _toolsForMagicRock = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'>,
) => {
	//
	const tools = await ctx.runQuery(internal.tools.private._findAll, {
		owner: task.owner,
		kind: 'http',
	});

	const map = {
		...toMap(
			tools.filter((tool) => tool.kind === 'http'),
			(tool) => createHttpTool(ctx, task, action, tool),
		),
		..._mutationTools(ctx, task._id, task.author, task.owner),
		..._syncTools(ctx, task._id, task.author, task.owner),
	};

	// Clear execute property from all tools before returning
	Object.values(map).forEach((tool) => {
		// @ts-ignore TODO: workaround because I cannot stop AI SDK from calling execute()
		tool.execute = undefined;
	});

	return map;
};

export const _mutationTools = (
	ctx: ActionCtx | MutationCtx, //
	taskId: Id<'tasks'>,
	author: z.infer<typeof authorSchema>,
	owner: Id<'users'>,
) => ({
	doNothing: tool({
		description: 'Do nothing.',
		parameters: z.object({}),
		execute: () => Promise.resolve(),
	}),
	updateTask: tool({
		description: 'Update the task',
		parameters: z.object({
			summary: z.string().optional().describe('The improved summary for the task'),
			description: z.string().optional().describe('The improved description for the task'),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._update, {
			taskId,
			author,
			...args,
		})
		.then(() => 'task updated'),
	}),
	markAsDone: tool({
		description: 'Mark the task as done or undone.',
		parameters: z.object({
			isDone: z.boolean().describe('Whether the task should be marked as done or undone.'),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._markAsDone, {
			taskId,
			author,
			...args,
		})
		.then(() => `task marked as ${args.isDone ? 'done' : '**not** done'}`),
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
			author,
			newParentId: args.newParentId === 'inbox' ? undefined : args.newParentId,
		}),
	}),
	createSubtask: tool({
		description: 'Create a subtask',
		parameters: z.object({
			description: z
				.string()
				.describe(
					'The first user message content in MDX format. Make sure to add all required details so another Meseeks can handle it properly. Think through your current context carefully and send a complete and structured message.',
				),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._add, {
			parentId: taskId,
			author,
			owner,
			description: args.description,
		}),
	}),
});

export const _syncTools = (
	ctx: ActionCtx | MutationCtx, //
	taskId: Id<'tasks'>,
	author: z.infer<typeof authorSchema>,
	owner: Id<'users'>,
) => ({
	say: tool({
		description: 'Send a text message to the user.',
		parameters: z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		// prettier-ignore
		execute: (args) => Promise.resolve(args.message),
	}),
	increaseBudget: tool({
		description: 'Increase the budget of the task',
		parameters: z.object({
			amount: z.number().describe('The amount of funds to add in USD.'),
		}),
		execute: (args) =>
			ctx.runMutation(internal.tasks.private._increaseBudget, {
				taskId,
				amount: args.amount,
			}),
	}),
});

function toMap<ToolType extends { key: string }, ReturnType>(
	tools: Array<ToolType>, //
	mapFn: (tool: ToolType) => ReturnType,
) {
	return tools.reduce(
		(acc, tool: ToolType) => {
			acc[tool.key] = mapFn(tool);
			return acc;
		},
		{} as Record<string, ReturnType>,
	);
}
