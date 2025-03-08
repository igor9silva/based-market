import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const multiply = defineSkill({
	isVisibleToMagicRock: true,
	preApprovedCost: 0n,
	description: 'Multiply N numbers',
	parameters: z.object({
		numbers: z.array(z.number()).describe('The numbers to multiply.'),
	}),
	reactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: args.numbers.reduce((acc, curr) => acc * curr, 1).toString(),
				reactions: execution.skill.reactions,
			};
		},
});
