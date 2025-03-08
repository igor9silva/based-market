import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const updateTask = defineSkill({
	preApprovedCost: 0n,
	description: 'Update the task description and/or summary',
	parameters: z.object({
		summary: z.string().max(100).optional().describe('The improved summary for the task. Be succinct.'),
		description: z
			.string()
			.optional()
			.describe(
				'The improved long description of the task. Only fill this if summary isn\'t enough. You can add infinite details here, BUT ONLY if they add value. Usually the less tokens you use, the better. Use MDX. Text should be an imperative description for either you or the user to handle, so instead of "the user wants to do XYZ", write "Do XYZ".',
			),
	}),
	reactions: [
		{
			skillKey: 'evaluateResolution',
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
