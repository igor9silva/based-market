import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { asDollars } from '../utils/money';

type ToolExecution = {
	ctx: ActionCtx | MutationCtx; //
	task: Doc<'tasks'>;
	action: Doc<'actions'>;
};

function defineSkill<T extends z.ZodType>(
	description: string,
	parameters: T,
	execute: (execution: ToolExecution) => (args: z.infer<T>) => Promise<string>,
) {
	return {
		description,
		parameters,
		execute,
	};
}

export const _builtInSkills = {
	say: defineSkill(
		'Send a text message to the user.',
		z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		(execution: ToolExecution) => (args) => Promise.resolve(args.message),
	),
	increaseBudget: defineSkill(
		'Increase the budget of the task',
		z.object({
			amount: z.bigint().describe('The amount of funds to add in USD.'),
		}),
		(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._increaseBudget, {
						taskId: execution.task._id,
						amount: args.amount,
					})
					.then(() => `budget increased by ${asDollars({ bigInt: args.amount })}`),
	),
	doNothing: defineSkill('Do nothing.', z.object({}), () => () => Promise.resolve('')),
	updateTask: defineSkill(
		'Update the task',
		z.object({
			summary: z.string().optional().describe('The improved summary for the task'),
			description: z.string().optional().describe('The improved description for the task'),
		}),
		(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._update, {
						taskId: execution.task._id,
						...args,
					})
					.then(() => `task updated`),
	),
	markAsDone: defineSkill(
		'Mark the task as done or undone.',
		z.object({
			isDone: z.boolean().describe('Whether the task should be marked as done or undone.'),
		}),
		(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._markAsDone, {
						taskId: execution.task._id,
						...args,
					})
					.then(() => `task marked as ${args.isDone ? 'done' : '**not** done'}`),
	),
	moveTask: defineSkill(
		'Move the task to a new parent',
		z.object({
			taskId: zid('tasks').describe('The task id to be moved.'),
			newParentId: z
				.union([zid('tasks'), z.literal('inbox')])
				.describe(
					'The new parent id for the task. Use "inbox" to move the task to the Inbox (aka root, no parent).',
				),
		}),
		(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._move, {
						taskId: args.taskId,
						newParentId: args.newParentId === 'inbox' ? undefined : args.newParentId,
					})
					.then(() => `task moved`),
	),
	createSubtask: defineSkill(
		'Create a subtask',
		z.object({
			description: z
				.string()
				.describe(
					'The first user message content in MDX format. Make sure to add all required details so another Meseeks can handle it properly. Think through your current context carefully and send a complete and structured message.',
				),
		}),
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
	),
};
