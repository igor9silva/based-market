import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const divide = defineSkill({
	preApprovedCost: 0n,
	description: 'Divide N numbers',
	parameters: z.object({
		A: z.number().describe('The dividend.'),
		B: z.number().describe('The divisor.'),
	}),
	knownReactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: (args.A / args.B).toString(),
				reactions: execution.skill.knownReactions,
			};
		},
});
