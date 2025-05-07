import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const requestIteration = defineSkill({
	preApprovedCost: 0n,
	description: 'Request a new iteration of the task',
	parameters: z.object({}),
	knownReactions: [
		{
			skillKey: 'iterate',
			args: {},
			condition: 'owner',
		},
	],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				reactions: execution.skill.knownReactions,
			};
		},
});
