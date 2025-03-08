import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const say = defineSkill({
	isVisibleToMagicRock: false,
	preApprovedCost: 0n,
	description: 'Send a text message',
	parameters: z.object({
		message: z.string().describe('The message to send to the user in MDX format.'),
	}),
	reactions: [
		{
			skillKey: 'evaluateUnderstanding',
			args: {},
			condition: 'any',
		},
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: args.message,
				reactions: execution.skill.reactions,
			};
		},
});
