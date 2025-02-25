import { tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { _builtInSkills } from './builtIn';

export function createBuiltInTool(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'> | undefined,
	skill: (typeof _builtInSkills)[keyof typeof _builtInSkills],
) {
	//
	const metadata = {
		description: skill.description,
		parameters: skill.parameters,
	};

	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async (args) => {
			// @ts-expect-error no time to fight this shit
			return skill.execute({ ctx, task, action })(parseArgs(skill, args));
		},
	});
}

function parseArgs<T extends z.ZodType>(skill: { parameters: T }, args: z.infer<T>) {
	return skill.parameters.parse(args);
}
