import { z } from 'zod';
import { internal } from '../../_generated/api';
import { asBigInt } from '../../utils/money';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const increaseBudget = defineSkill({
	isVisibleToMagicRock: false,
	preApprovedCost: 'none',
	description: 'Increase the budget of the task',
	parameters: z.object({
		amount: z.number().min(0).max(10).describe('The amount of funds to add in USD.'),
	}),
	reactions: [
		{
			skillKey: 'iterate',
			args: {},
			condition: 'any',
		},
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._increaseBudget, {
				taskId: execution.task._id,
				amount: asBigInt({ dollars: args.amount }),
			});

			return {
				result: `budget increased by ${args.amount} USD`,
				reactions: execution.skill.reactions,
			};
		},
});
