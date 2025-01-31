import { tool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc, Id } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { internalQuery } from '../lib';
import { _askMagicRock } from '../magicRock';
import { authorSchema } from '../schemas/authorSchema';
import { toolOwnerSchema } from '../schemas/toolSchema';
import { createHttpTool } from './createHttpTool';

// all global tools + all user-defined tools
export const _findAll = internalQuery({
	args: {
		author: authorSchema,
	},
	handler: async (ctx, { author }) => {
		//
		const [globals, users] = await Promise.all([
			_findAllByOwner(ctx, { owner: 'built-in' }), // global tools
			_findAllByOwner(ctx, { owner: author }), // user-defined tools
		]);

		console.debug('tools/globals', globals);
		console.debug('tools/users', users);

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
	action: Doc<'actions'>,
) => ({
	..._mutationTools(ctx, task._id, task.author),
	..._decisionTools(ctx, task, action),
	...(await _httpTools(ctx, task, action)),
});

export const _mutationTools = (
	ctx: ActionCtx | MutationCtx, //
	taskId: Id<'tasks'>,
	author: z.infer<typeof authorSchema>,
) => ({
	doNothing: tool({
		description: 'Do nothing.',
		parameters: z.object({}),
		execute: () => Promise.resolve(),
	}),
	say: tool({
		description: 'Send a text message to the user.',
		parameters: z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		// prettier-ignore
		execute: (args) => Promise.resolve(args.message),
	}),
	updateTask: tool({
		description: 'Update the task',
		parameters: z.object({
			title: z.string().optional().describe('The improved title for the task'),
			body: z.string().optional().describe('The improved body/description for the task'),
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
			body: z
				.string()
				.describe(
					'The first user message content in MDX format. Make sure to add all required details so another Meseeks can handle it properly. Think through your current context carefully and send a complete and structured message.',
				),
		}),
		// prettier-ignore
		execute: (args) => ctx.runMutation(internal.tasks.private._add, {
			parentId: taskId,
			author,
			body: args.body,
		}),
	}),
});

export const _httpTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
) => {
	//
	const tools = await ctx.runQuery(internal.tools.private._findAll, {
		author: task.author,
	});

	return toMap(tools, (tool) => createHttpTool(ctx, task, action, tool));
};

export const _decisionTools = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
) => ({
	react: tool({
		description: 'React to the latest actions on the task, and decide the next actions.',
		parameters: z.object({}),
		execute: async () => {
			//
			const result = await _askMagicRock(ctx, task, action);

			console.debug('magicRock/result/finishReason', result.finishReason);

			switch (result.finishReason) {
				//
				case 'tool-calls':
					//
					// TODO: think about parallelizing tool calls
					const toolCalls = await Promise.allSettled(
						result.toolCalls.map(async (call) => {
							//
							return ctx.runMutation(internal.action.private._add, {
								toolKey: call.toolName,
								args: call.args,
								taskId: task._id,
								author: action._id,
							});
						}),
					);

					// TODO: notify errors
					toolCalls
						.filter((call) => call.status === 'rejected')
						.forEach((call) => {
							console.error('tool call failed', call.reason);
						});

					break;

				case 'stop':
					// if (result.text.length < 1) break;
					await ctx.runMutation(internal.action.private._add, {
						toolKey: 'say',
						args: { message: result.text },
						taskId: task._id,
						author: action._id,
					});
					break;

				case 'error':
					await ctx.runMutation(internal.action.private._add, {
						toolKey: 'say',
						args: { message: result.text },
						taskId: task._id,
						author: action._id,
					});
					break;

				case 'content-filter':
					await ctx.runMutation(internal.action.private._add, {
						toolKey: 'say',
						args: { message: `[damn @sama] Content filter hit: ${result.warnings}` },
						taskId: task._id,
						author: action._id,
					});
					break;

				case 'length':
					// TODO: better handling of max length
					await ctx.runMutation(internal.action.private._add, {
						toolKey: 'say',
						args: { message: `Max length hit: ${result.warnings}` },
						taskId: task._id,
						author: action._id,
					});
					break;

				default:
					throw new Error(`Unknown finish reason: ${result.finishReason}`);
			}

			return result.toolCalls.map((call) => `${call.toolName}()`).join(', ') ?? 'done';
		},
	}),
});

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
