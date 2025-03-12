import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const say = defineSkill({
	isVisibleToMagicRock: false,
	preApprovedCost: 0n,
	description: 'Send a text message',
	parameters: z.object({
		message: z.string().describe('The message in MDX format.'),
	}),
	knownReactions: [
		{
			skillKey: 'inferUserIntent',
			args: {},
			condition: 'owner',
		},
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			return {
				result: args.message,
				reactions: execution.skill.knownReactions,
			};
		},
});
