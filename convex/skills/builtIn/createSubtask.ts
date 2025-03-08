import { z } from 'zod';
import { internal } from '../../_generated/api';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const createSubtask = defineSkill({
	isVisibleToMagicRock: false,
	preApprovedCost: 'none',
	description: 'Create a subtask',
	parameters: z.object({
		description: z
			.string()
			.describe(
				'The first user message content in MDX format. Make sure to add all required details so another Meseeks can handle it properly. Think through your current context carefully and send a complete and structured message.',
			),
	}),
	reactions: [],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._add, {
				parentId: execution.task._id,
				author: execution.action?._id,
				owner: execution.task.owner,
				description: args.description,
			});

			return {
				result: 'ok',
				reactions: execution.skill.reactions,
			};
		},
});
