import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const sum = defineSkill({
	preApprovedCost: 0n,
	description: 'Sum N numbers',
	parameters: z.object({
		numbers: z.array(z.number()).describe('The numbers to sum.'),
	}),
	knownReactions: [
		{
			skillKey: 'iterate',
			args: {},
			condition: 'companion',
		},
	],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				text: args.numbers.reduce((acc, curr) => acc + curr, 0).toString(),
				reactions: execution.skill.knownReactions,
			};
		},
});
