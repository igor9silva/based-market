import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const resolve = defineSkill({
	preApprovedCost: 'none',
	description: 'Mark the task as done. This is called when the current resolution resolves the task successfully.',
	parameters: z.object({}),
	reactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
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
