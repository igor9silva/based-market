import { tool } from 'ai';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { AITool } from '../schemas/toolSchema';
import { _builtInSkills } from './builtIn/index';
import { createReactions } from './createReactions';

export function createBuiltInTool(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: (typeof _builtInSkills)[keyof typeof _builtInSkills],
): AITool {
	//
	return tool({
		description: skill.description,
		parameters: skill.parameters,
		execute: async (args) => {
			//
			// @ts-expect-error no time to fight this shit
			const { result, reactions } = await skill.use({ ctx, task, action, skill })(args);

			return {
				result: {
					...(result ? { text: result } : {}),
					reactions: createReactions(action, reactions),
				},
				costs: [
					{
						symbol: 'USD',
						amount: 0n,
						description: 'Built-in skills are free of charge.',
					},
				],
			};
		},
	});
}
