import { tool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc, Id } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { authorSchema } from '../schemas/authorSchema';
import { createAITool } from './createAITool';
import { createHTTPTool } from './createHttpTool';

export const _allSkillsAsTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'>,
) => {
	//
	const skills = await ctx.runQuery(internal.skills.private._findAll, {
		owner: task.owner,
	});

	return {
		...toMap(
			skills.filter((skill) => skill.kind === 'soft'),
			(skill) => createAITool(ctx, task, action, skill),
		),
		...toMap(
			skills.filter((skill) => skill.kind === 'hard'),
			(skill) => createHTTPTool(ctx, task, action, skill),
		),
		..._builtInTools(ctx, task._id, task.author, task.owner),
	};
};

export const _allHardSkillsAsTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'>,
) => {
	//
	const skills = await ctx.runQuery(internal.skills.private._findAll, {
		owner: task.owner,
		kind: 'hard',
	});

	const map = {
		...toMap(
			skills.filter((skill) => skill.kind === 'hard'),
			(skill) => createHTTPTool(ctx, task, action, skill),
		),
		..._builtInTools(ctx, task._id, task.author, task.owner),
	};

	Object.values(map).forEach((skill) => {
		// @ts-ignore TODO: workaround because I cannot stop AI SDK from calling execute()
		skill.execute = undefined;
	});

	return map;
};

export const _builtInTools = (
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
		execute: (args) => Promise.resolve(args.message),
	}),
	increaseBudget: tool({
		description: 'Increase the budget of the task',
		parameters: z.object({
			amount: z.bigint().describe('The amount of funds to add in USD.'),
		}),
		execute: (args) =>
			ctx.runMutation(internal.tasks.private._increaseBudget, {
				taskId,
				amount: args.amount,
			}),
	}),
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

function toMap<SkillType extends { key: string }, ReturnType>(
	skills: Array<SkillType>, //
	mapFn: (skill: SkillType) => ReturnType,
) {
	return skills.reduce(
		(acc, skill: SkillType) => {
			acc[skill.key] = mapFn(skill);
			return acc;
		},
		{} as Record<string, ReturnType>,
	);
}
