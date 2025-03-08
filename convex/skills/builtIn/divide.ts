import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const divide = defineSkill({
	isVisibleToMagicRock: true,
	preApprovedCost: 0n,
	description: 'Divide N numbers',
	parameters: z.object({
		A: z.number().describe('The dividend.'),
		B: z.number().describe('The divisor.'),
	}),
	reactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: (args.A / args.B).toString(),
				reactions: execution.skill.reactions,
			};
		},
});
