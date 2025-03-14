import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const updateInstructions = defineSkill({
	preApprovedCost: 0n,
	description: 'Update the task instructions.',
	parameters: z.object({
		title: z
			.string()
			.max(60)
			.optional()
			.describe(
				'A short title for the task. Max 60 characters. Make sure it encodes THE ENTIRE instructions as much as you can.',
			),
		instructions: z
			.string()
			.optional()
			.describe(`MDX. Add any details on how to handle the task, what should be done, how, references, etc.`),
	}),
	knownReactions: [
		{
			skillKey: 'seek',
			args: {},
			condition: 'any',
		},
	],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._updateInstructions, {
				taskId: execution.task._id,
				title: args.title,
				instructions: args.instructions,
			});

			return {
				result: 'ok',
				reactions: execution.skill.knownReactions,
			};
		},
});
