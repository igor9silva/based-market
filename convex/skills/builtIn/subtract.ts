import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const subtract = defineSkill({
	isVisibleToMagicRock: true,
	preApprovedCost: 0n,
	description: 'Subtract N numbers',
	parameters: z.object({
		numbers: z.array(z.number()).describe('The numbers to subtract.'),
	}),
	knownReactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: args.numbers.reduce((acc, curr) => acc - curr, 0).toString(),
				reactions: execution.skill.knownReactions,
			};
		},
});
