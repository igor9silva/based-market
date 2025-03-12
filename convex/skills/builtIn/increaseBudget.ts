import { z } from 'zod';
import { internal } from '../../_generated/api';
import { asDollars } from '../../utils/money';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const increaseBudget = defineSkill({
	isVisibleToMagicRock: false,
	preApprovedCost: 'none',
	description: 'Increase the budget of the task',
	parameters: z.object({
		amount: z.bigint().min(0n).describe('The amount of funds to add, in USD.'),
	}),
	knownReactions: [
		{
			skillKey: 'inferUserIntent',
			args: {},
			condition: 'owner',
		},
	],
	execute:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			await execution.ctx.runMutation(internal.tasks.private._increaseBudget, {
				taskId: execution.task._id,
				amount: args.amount,
			});

			return {
				result: `budget increased by ${asDollars({ bigInt: args.amount })}`,
				reactions: execution.skill.knownReactions,
			};
		},
});
