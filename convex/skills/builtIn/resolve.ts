import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const resolve = defineSkill({
	preApprovedCost: 'none',
	description: 'Mark the task as done, and learn!',
	parameters: z.object({
		reasoning: z.string().optional().describe('A short explanation for resolving the task.'),
	}),
	reactions: [
		// {
		// 	skillKey: 'learn',
		// 	args: {},
		// 	condition: 'any',
		// },
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._markAsDone, {
				taskId: execution.task._id,
				isDone: true,
			});

			return {
				result: args.reasoning ?? 'ok',
				reactions: execution.skill.reactions,
			};
		},
});
