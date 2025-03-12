import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const discard = defineSkill({
	preApprovedCost: 'none',
	description: 'Discard the current task by marking it as done without learning.',
	parameters: z.object({
		reasoning: z.string().optional().describe('A short explanation for discarding the task.'),
	}),
	knownReactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._setStatus, {
				taskId: execution.task._id,
				newStatus: 'discarded',
			});

			return {
				result: args.reasoning ?? 'ok',
				reactions: execution.skill.knownReactions,
			};
		},
});
