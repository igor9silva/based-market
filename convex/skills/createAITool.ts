import { tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { newActionSchema } from '../action/private';
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
				reasoning,
				reasoningDetails,
				providerMetadata,
				//
			} = await _askMagicRock(ctx, task, action, skill);

			console.debug('Reasoning', reasoning);
			console.debug('Reasoning details', reasoningDetails);
			console.debug('Provider metadata', providerMetadata);

			const reactions = [] as Array<z.infer<typeof newActionSchema>>;

			// prettier-ignore
			const say = (text: string) => reactions.push({
				skillKey: 'say',
				args: { message: text },
				taskId: task._id,
				author: action._id,
				owner: task.owner,
			});

			switch (finishReason) {
				//
				case 'tool-calls':
					//
					reactions.push(
						...toolCalls.map((call) => ({
							skillKey: call.toolName,
							args: call.args,
							taskId: task._id,
							author: action._id,
							owner: task.owner,
						})),
					);
					break;

				case 'stop':
					// if (result.text.length < 1) break;
					say(text);
					break;

				case 'error':
					say(text);
					break;

				case 'content-filter':
					say(`[damn @sama] Content filter hit: ${warnings}`);
					break;

				case 'length':
					// TODO: better handling of max length
					say(`Max length hit: ${warnings}`);
					break;

				default:
					throw new Error(`Unknown finish reason: ${finishReason}`);
			}

			if (warnings?.length) console.warn('Decision skill warnings', warnings);

			return {
				result: toolCalls.map((call) => `${call.toolName}()`).join(', ') ?? 'nothing',
				reactions,
				costs: [
					{
						symbol: 'USD',
						amount: calculateProviderCost(
							usage.promptTokens,
							usage.completionTokens,
							reasoningTokensFrom(providerMetadata),
						),
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

function reasoningTokensFrom(providerMetadata: any) {
	//
	const reasoningTokens = providerMetadata?.openai?.reasoningTokens ?? 0;
	//
	return typeof reasoningTokens === 'number' ? reasoningTokens : 0;
}

export function calculateProviderCost(
	inputTokens: number, //
	outputTokens: number,
	reasoningTokens: number,
) {
	// TODO: make it dynamic, per model
	const INPUT_TOKEN_COST = asBigInt({ dollars: 2.5 }) / 1_000_000n;
	const OUTPUT_TOKEN_COST = asBigInt({ dollars: 10 }) / 1_000_000n;

	console.debug('Input tokens', inputTokens);
	console.debug('Output tokens', outputTokens);

	const inputCost = BigInt(inputTokens) * INPUT_TOKEN_COST;
	const outputCost = BigInt(outputTokens + reasoningTokens) * OUTPUT_TOKEN_COST;
	const totalProviderCost = inputCost + outputCost;

	console.debug('Decision provider cost', asDollars({ bigInt: totalProviderCost, precision: 6 }));
	console.debug('Action cost', asDollars({ bigInt: env.ACTION_COST_USD, precision: 6 }));

	return totalProviderCost;
}
