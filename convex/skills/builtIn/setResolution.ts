import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const setResolution = defineSkill({
	preApprovedCost: 0n,
	description:
		'Set the resolution text. Use this to draft a resolution while still working on the task. Resolution should be as straight forward as possible.',
	parameters: z.object({
		resolution: z.string().describe('The resolution text in MDX format.'),
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
			await execution.ctx.runMutation(internal.tasks.private._setResolution, {
				taskId: execution.task._id,
				resolution: args.resolution,
			});

			return {
				result: 'ok',
				reactions: execution.skill.reactions,
			};
		},
});
