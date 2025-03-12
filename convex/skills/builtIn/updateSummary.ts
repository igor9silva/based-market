import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const updateSummary = defineSkill({
	preApprovedCost: 0n,
	description: 'Update the task summary.',
	parameters: z.object({
		summary: z.string().describe(`MDX. Add any details on what we have done so far. Bullet points are preferred.`),
	}),
	knownReactions: [
		// {
		// 	skillKey: 'seek',
		// 	args: {},
		// 	condition: 'any',
		// },
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._updateSummary, {
				taskId: execution.task._id,
				summary: args.summary,
			});

			return {
				result: 'ok',
				reactions: execution.skill.knownReactions,
			};
		},
});
