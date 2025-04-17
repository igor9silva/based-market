import { z } from 'zod';
import { asBigInt, asDollars } from '../../utils/money';
import { defineSkill, ExecutionResult, ToolExecution } from '../defineSkill';

export const requestBudget = defineSkill({
	//
	preApprovedCost: asBigInt({ dollars: 0.01 }),
	description: 'Request budget increase for the task',
	parameters: z.object({
		estimatedCost: z.bigint().describe('The estimated cost for the failed action, in USDc'),
		previousActionKey: z.string().describe('The key of the previous action that failed'),
	}),
	knownReactions: [],
	use:
		(execution: ToolExecution) =>
		async (args): Promise<ExecutionResult> => {
			//
			throw new Error(
				`This task needs more budget to continue. Estimated cost for \`${args.previousActionKey}\` is ${asDollars({ bigInt: args.estimatedCost })} USDc.\n\n<AddBudgetButton />`,
			);
		},
});
