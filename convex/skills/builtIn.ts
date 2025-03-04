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
	isVisibleToMagicRock?: boolean;
	preApprovedCost: bigint | 'none';
	description: string;
	parameters: T;
	execute: (execution: ToolExecution) => (args: z.infer<T>) => Promise<string>;
}) => ({
	// TODO: this is a temporary solution. Skill selection should be done on the action.
	isVisibleToMagicRock: skill.isVisibleToMagicRock === undefined ? true : skill.isVisibleToMagicRock,
	...skill,
});

export const _builtInSkills = {
	say: defineSkill({
		isVisibleToMagicRock: false,
		preApprovedCost: 0n,
		description: 'Send a text message to the user.',
		parameters: z.object({
			message: z.string().describe('The message to send to the user in MDX format.'),
		}),
		execute: (execution: ToolExecution) => (args) => Promise.resolve(args.message),
	}),
	reason: defineSkill({
		isVisibleToMagicRock: true,
		preApprovedCost: 0n,
		description:
			'Use this tool to reason about your next decision. Feel free to use it as many times as needed. Nothing you say here will be visible to the user, but will be visible to your next iterations. Note: reasoning before making a decision increases the quality of your decisions.',
		parameters: z.object({
			reasoning: z.string().describe('The reasoning.'),
		}),
		execute: (execution: ToolExecution) => (args) => Promise.resolve(args.reasoning),
	}),
	increaseBudget: defineSkill({
		isVisibleToMagicRock: false,
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
			summary: z.string().max(100).optional().describe('The improved summary for the task. Be succint.'),
			description: z
				.string()
				.optional()
				.describe(
					'The improved long description of the task. You can add infinite details here, BUT ONLY if they add value. Usually the less tokens you use, the better.',
				),
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
	reopen: defineSkill({
		preApprovedCost: 'none',
		description: 'Re-open a task that was previously marked as done.',
		isVisibleToMagicRock: false,
		parameters: z.object({}),
		execute:
			(execution: ToolExecution) =>
			async (args): Promise<string> => {
				//
				await execution.ctx.runMutation(internal.tasks.private._markAsDone, {
					taskId: execution.task._id,
					isDone: false,
				});

				return `re-opened`;
			},
	}),
	resolve: defineSkill({
		preApprovedCost: 'none',
		// description: 'Mark the task as done, generate a resolution if empty, and learn from it.',
		description:
			'Mark the task as done. MUST have set a resolution first or will be auto-rejected. Before calling this, a best practice is to reason() on the current resolution (should be on your system prompt) and make sure you are at LEAST 80% sure it solves the task. If not, keep working with the tools you have until you are sure.',
		parameters: z.object({
			// resolution: z
			// 	.string()
			// 	.optional()
			// 	.describe(
			// 		'The resolution text in MDX format. If not provided and no existing resolution, one will be generated.',
			// 	),
		}),
		execute:
			(execution: ToolExecution) =>
			async (args): Promise<string> => {
				//
				// if (args.resolution) {
				// 	await execution.ctx.runMutation(internal.tasks.private._setResolution, {
				// 		taskId: execution.task._id,
				// 		resolution: args.resolution,
				// 	});
				// }

				await execution.ctx.runMutation(internal.tasks.private._markAsDone, {
					taskId: execution.task._id,
					isDone: true,
				});

				return `resolved`;
			},
	}),
	archive: defineSkill({
		preApprovedCost: 'none',
		description:
			"Mark the task as done without learning from it (for tasks that were abandoned or not relevant). Use this when you need to close a task that isn't relevant anymore/abandoned.",
		parameters: z.object({}),
		execute: (execution: ToolExecution) => async (): Promise<string> => {
			//
			// Make sure task has no resolution
			await execution.ctx.runMutation(internal.tasks.private._setResolution, {
				taskId: execution.task._id,
				resolution: undefined,
			});

			// Mark it as done
			await execution.ctx.runMutation(internal.tasks.private._markAsDone, {
				taskId: execution.task._id,
				isDone: true,
			});

			return `archived`;
		},
	}),
	setResolution: defineSkill({
		preApprovedCost: 0n,
		description:
			'Set the resolution text. Use this to draft a resolution while still working on the task. Resolution should be as straight forward as possible. Use the least amount of tokens possible that meets the task requirements. If you need to add more details or links, start with the answer (and highlight it) and then add the details.',
		parameters: z.object({
			resolution: z.string().describe('The resolution text in MDX format.'),
		}),
		execute:
			(execution: ToolExecution) =>
			(args): Promise<string> =>
				execution.ctx
					.runMutation(internal.tasks.private._setResolution, {
						taskId: execution.task._id,
						resolution: args.resolution,
					})
					.then(() => `Resolution set.`),
	}),
	moveTask: defineSkill({
		isVisibleToMagicRock: false,
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
		isVisibleToMagicRock: false,
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
	sum: defineSkill({
		isVisibleToMagicRock: true,
		preApprovedCost: 0n,
		description: 'Sum N numbers',
		parameters: z.object({
			numbers: z.array(z.number()).describe('The numbers to sum.'),
		}),
		execute: (execution: ToolExecution) => (args) =>
			Promise.resolve(args.numbers.reduce((acc, curr) => acc + curr, 0).toString()),
	}),
	multiply: defineSkill({
		isVisibleToMagicRock: true,
		preApprovedCost: 0n,
		description: 'Multiply N numbers',
		parameters: z.object({
			numbers: z.array(z.number()).describe('The numbers to multiply.'),
		}),
		execute: (execution: ToolExecution) => (args) =>
			Promise.resolve(args.numbers.reduce((acc, curr) => acc * curr, 1).toString()),
	}),
	divide: defineSkill({
		isVisibleToMagicRock: true,
		preApprovedCost: 0n,
		description: 'Divide N numbers',
		parameters: z.object({
			A: z.number().describe('The dividend.'),
			B: z.number().describe('The divisor.'),
		}),
		execute: (execution: ToolExecution) => (args) => Promise.resolve((args.A / args.B).toString()),
	}),
	subtract: defineSkill({
		isVisibleToMagicRock: true,
		preApprovedCost: 0n,
		description: 'Subtract N numbers',
		parameters: z.object({
			numbers: z.array(z.number()).describe('The numbers to subtract.'),
		}),
		execute: (execution: ToolExecution) => (args) =>
			Promise.resolve(args.numbers.reduce((acc, curr) => acc - curr, 0).toString()),
	}),
};
