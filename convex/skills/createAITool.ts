import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { _askMagicRock } from '../magicRock';
import { env } from '../schemas/envSchema';
import { softSkillSchema } from '../schemas/skillSchema';
import { AITool } from '../schemas/toolSchema';
import { asBigInt, asDollars } from '../utils/money';
import { stringToZod } from '../utils/zodToString';

export function createAITool(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
): AITool {
	//
	return tool({
		description: skill.description,
		parameters: stringToZod(skill.parametersSchema),
		execute: async (args) => {
			//
			console.debug('Running decision skill', skill.key, args);

			const {
				text, //
				toolCalls,
				finishReason,
				usage,
				warnings,
			} = await _askMagicRock(ctx, task, action, skill.config.instructions);

			switch (finishReason) {
				//
				case 'tool-calls':
					//
					// TODO: think about parallelizing tool calls
					const calls = await Promise.allSettled(
						toolCalls.map(async (call) => {
							//
							return ctx.runMutation(internal.action.private._add, {
								skillKey: call.toolName,
								args: call.args,
								taskId: task._id,
								author: action._id,
								owner: task.owner,
							});
						}),
					);

					// TODO: notify errors
					calls
						.filter((call) => call.status === 'rejected')
						.forEach((call) => {
							console.error('skill call failed', call.reason);
						});

					break;

				case 'stop':
					// if (result.text.length < 1) break;
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: text },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				case 'error':
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: text },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				case 'content-filter':
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: `[damn @sama] Content filter hit: ${warnings}` },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				case 'length':
					// TODO: better handling of max length
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: `Max length hit: ${warnings}` },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				default:
					throw new Error(`Unknown finish reason: ${finishReason}`);
			}

			// TODO: make it dynamic, per model
			const INPUT_TOKEN_COST = asBigInt({ dollars: 2.5 }) / 1_000_000n;
			const OUTPUT_TOKEN_COST = asBigInt({ dollars: 10 }) / 1_000_000n;

			const inputCost = BigInt(usage.promptTokens) * INPUT_TOKEN_COST;
			const outputCost = BigInt(usage.completionTokens) * OUTPUT_TOKEN_COST;
			const totalProviderCost = inputCost + outputCost;

			console.debug('Decision provider cost', asDollars({ bigInt: totalProviderCost, precision: 6 }));

			if (warnings?.length) {
				console.warn('Decision skill warnings', warnings);
			}

			return {
				result: toolCalls.map((call) => `${call.toolName}()`).join(', ') ?? 'nothing',
				costs: [
					{
						symbol: 'USD',
						amount: totalProviderCost,
						description: 'Provider cost',
					},
					{
						symbol: 'USD',
						amount: env.ACTION_COST_USD,
						description: '1 Meseeks action',
					},
				],
			};
		},
	});
}
