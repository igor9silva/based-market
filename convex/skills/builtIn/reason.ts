import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const reason = defineSkill({
	preApprovedCost: 0n,
	description:
		'Use this tool to reason about your next decision. Feel free to use it as many times as needed. Nothing you say here will be visible to the user, but will be visible to your next iterations. Note: reasoning before making a decision increases the quality of your decisions.',
	parameters: z.object({
		reasoning: z.string().describe('The reasoning.'),
	}),
	knownReactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: args.reasoning,
				reactions: execution.skill.knownReactions,
			};
		},
});
