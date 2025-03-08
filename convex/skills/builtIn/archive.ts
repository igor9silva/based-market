import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const archive = defineSkill({
	preApprovedCost: 'none',
	description:
		"Mark the task as done without learning from it (for tasks that were abandoned or not relevant). Use this when you need to close a task that isn't relevant anymore/abandoned.",
	parameters: z.object({}),
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
				result: 'ok',
				reactions: execution.skill.reactions,
			};
		},
});
