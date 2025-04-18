import { z } from 'zod';
import { internal } from '../../_generated/api';
import { newSkillSchema } from '../../schemas/skillSchema';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const createSkill = defineSkill({
	preApprovedCost: 0n,
	description: 'Learn a new skill.',
	parameters: z.object({
		skill: newSkillSchema,
	}),
	knownReactions: [
		{
			skillKey: 'learnSkill',
			args: {},
			condition: 'companion',
		},
	],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.skills.private._create, {
				skill: args.skill,
				userId: execution.task.owner,
			});

			const kind = args.skill.kind === 'hard' ? 'Hard' : 'Soft';
			return {
				text: `🎓 ${kind} skill '${args.skill.key}' learned.`,
				reactions: execution.skill.knownReactions,
			};
		},
});
