import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const discard = defineSkill({
	preApprovedCost: 'none',
	description: 'Discard the current task by marking it as done without learning.',
	parameters: z.object({
		reasoning: z.string().optional().describe('A short explanation for discarding the task.'),
	}),
	reactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			// Make sure task has no resolution
			await execution.ctx.runMutation(internal.tasks.private._setResolution, {
				taskId: execution.task._id,
				resolution: undefined,
			});

			// Mark it as done
			await execution.ctx.runMutation(internal.tasks.private._markAsDone, {
				taskId: execution.task._id,
				isDone: true,
			});

			return {
				result: args.reasoning ?? 'ok',
				reactions: execution.skill.reactions,
			};
		},
});
