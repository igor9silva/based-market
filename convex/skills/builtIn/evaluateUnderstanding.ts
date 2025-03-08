import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const evaluateUnderstanding = defineSkill({
	preApprovedCost: 0n,
	description: 'Evaluate whether the current task understanding is accurate.',
	parameters: z.object({}),
	reactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: 'Evaluating understanding of task based on user input...',
				reactions: execution.skill.reactions,
			};
		},
});
