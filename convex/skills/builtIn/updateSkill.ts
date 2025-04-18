import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import { newSkillSchema } from '../../schemas/skillSchema';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const updateSkill = defineSkill({
	preApprovedCost: 0n,
	description: 'Update details of a skill we already know.',
	parameters: z.object({
		skillId: zid('skills'),
		updatedSkill: newSkillSchema,
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
			await execution.ctx.runMutation(internal.skills.private._update, {
				skillId: args.skillId,
				updatedSkill: args.updatedSkill,
				userId: execution.task.owner,
			});

			const kind = args.updatedSkill.kind === 'hard' ? 'Hard' : 'Soft';
			return {
				text: `✍️ ${kind} skill '${args.updatedSkill.key}' updated.`,
				reactions: execution.skill.knownReactions,
			};
		},
});
