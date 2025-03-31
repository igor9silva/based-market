import { z } from 'zod';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const say = defineSkill({
	preApprovedCost: 0n,
	description: 'Send a text message',
	parameters: z.object({
		message: z.string().describe('The message in MDX format.'),
		isDone: z
			.boolean()
			.optional()
			.default(false)
			.describe('Whether to keep iterating. If `true`, will stop the loop and await for user feedback.'),
	}),
	knownReactions: [
		{
			skillKey: 'inferUserIntent',
			args: {},
			condition: 'owner',
		},
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
				text: args.message,
				reactions: args.isDone ? [] : execution.skill.knownReactions,
			};
		},
});
