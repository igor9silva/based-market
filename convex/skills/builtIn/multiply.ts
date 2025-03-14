import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const multiply = defineSkill({
	preApprovedCost: 0n,
	description: 'Multiply N numbers',
	parameters: z.object({
		numbers: z.array(z.number()).describe('The numbers to multiply.'),
	}),
	knownReactions: [],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: args.numbers.reduce((acc, curr) => acc * curr, 1).toString(),
				reactions: execution.skill.knownReactions,
			};
		},
});
