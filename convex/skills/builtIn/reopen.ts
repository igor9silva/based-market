import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const reopen = defineSkill({
	preApprovedCost: 'none',
	description: 'Re-open a task that was previously marked as done.',
	parameters: z.object({}),
	knownReactions: [
		{
			skillKey: 'instruct',
			args: {},
			condition: 'owner',
		},
	],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._setStatus, {
				taskId: execution.task._id,
				newStatus: 'idle',
			});

			return {
				reactions: execution.skill.knownReactions,
			};
		},
});
