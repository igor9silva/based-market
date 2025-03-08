import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const updateTask = defineSkill({
	preApprovedCost: 0n,
	description: 'Update the task title and/or details.',
	parameters: z.object({
		title: z.string().max(100).optional().describe('A short title for the task. Max 100 characters.'),
		details: z
			.string()
			.optional()
			.describe(`MDX. Add any details on how to handle the task, what should be done, how, references, etc.`),
	}),
	reactions: [
		{
			skillKey: 'seek',
			args: {},
			condition: 'any',
		},
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._update, {
				taskId: execution.task._id,
				...args,
			});

			return {
				result: 'ok',
				reactions: execution.skill.reactions,
			};
		},
});
