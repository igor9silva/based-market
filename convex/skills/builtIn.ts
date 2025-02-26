import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { asBigInt } from '../utils/money';

type ToolExecution = {
	ctx: ActionCtx | MutationCtx; //
	task: Doc<'tasks'>;
	action: Doc<'actions'>;
};

const defineSkill = <T extends z.AnyZodObject>(skill: {
	preApprovedCost: bigint | 'none';
	description: string;
	parameters: T;
	execute: (execution: ToolExecution) => (args: z.infer<T>) => Promise<string>;
}) => skill;

export const _builtInSkills = {
	say: defineSkill({
		preApprovedCost: 0n,
		description: 'Send a text message to the user.',
		parameters: z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		execute: (execution: ToolExecution) => (args) => Promise.resolve(args.message),
	}),
	increaseBudget: defineSkill({
		preApprovedCost: 'none',
		description: 'Increase the budget of the task',
		parameters: z.object({
			amount: z.number().min(0).max(10).describe('The amount of funds to add in USD.'),
		}),
		execute:
			(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._increaseBudget, {
						taskId: execution.task._id,
						amount: asBigInt({ dollars: args.amount }),
					})
					.then(() => `budget increased by ${args.amount} USD`),
	}),
	askForClarification: defineSkill({
		preApprovedCost: 0n,
		description:
			'Before executing a task, make sure you are at least 80% sure of the user intention for the task. Use this tool to ask for user clarification. Avoid this since you an autonomous agent, but do not repeat yourself. Its better to interrupt the user than to repeat yourself.',
		parameters: z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		execute: (execution: ToolExecution) => (args) => Promise.resolve(args.message),
	}),
	updateTask: defineSkill({
		preApprovedCost: 0n,
		description: 'Update the task description and/or summary',
		parameters: z.object({
			summary: z.string().max(140).optional().describe('The improved summary for the task'),
			description: z.string().optional().describe('The improved long description of the task'),
		}),
		execute:
			(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._update, {
						taskId: execution.task._id,
						...args,
					})
					.then(() => `task updated`),
	}),
	markAsDone: defineSkill({
		preApprovedCost: 'none',
		description: 'Mark the task as done or undone.',
		parameters: z.object({
			isDone: z.boolean().describe('Whether the task should be marked as done or undone.'),
		}),
		execute:
			(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._markAsDone, {
						taskId: execution.task._id,
						...args,
					})
					.then(() => `task marked as ${args.isDone ? 'done' : '**not** done'}`),
	}),
	moveTask: defineSkill({
		preApprovedCost: 'none',
		description: 'Move the task to a new parent',
		parameters: z.object({
			taskId: zid('tasks').describe('The task id to be moved.'),
			newParentId: z
				.union([zid('tasks'), z.literal('inbox')])
				.describe(
					'The new parent id for the task. Use "inbox" to move the task to the Inbox (aka root, no parent).',
				),
		}),
		execute:
			(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._move, {
						taskId: args.taskId,
						newParentId: args.newParentId === 'inbox' ? undefined : args.newParentId,
					})
					.then(() => `task moved`),
	}),
	createSubtask: defineSkill({
		preApprovedCost: 'none',
		description: 'Create a subtask',
		parameters: z.object({
			description: z
				.string()
				.describe(
					'The first user message content in MDX format. Make sure to add all required details so another Meseeks can handle it properly. Think through your current context carefully and send a complete and structured message.',
				),
		}),
		execute:
			(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._add, {
						parentId: execution.task._id,
						author: execution.action?._id,
						owner: execution.task.owner,
						description: args.description,
					})
					.then(() => `subtask created`),
	}),
};
