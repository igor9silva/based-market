import { type CoreMessage, tool, type ToolSet } from 'ai';
import type { z } from 'zod';
import type { Doc, Id } from '../_generated/dataModel';
import type { ActionCtx, MutationCtx } from '../_generated/server';
import { _askMagicRock, type MagicRockContext } from '../magicRock';
import type { newActionSchema } from '../schemas/actionSchema';
import { env } from '../schemas/envSchema';
import type { modelsSchema, skillSchema, softSkillSchema } from '../schemas/skillSchema';
import type { AITool } from '../schemas/toolSchema';
import { asBigInt, asDollars } from '../utils/money';
import { stringToZod } from '../utils/zodToString';

export function createAITool(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
	context?: MagicRockContext,
): AITool {
	//
	if (!context) {
		return {
			description: skill.description,
			parameters: stringToZod(skill.inputSchema),
		};
	}

	return tool({
		description: skill.description,
		parameters: stringToZod(skill.inputSchema),
		execute: async (args) => {
			//
			console.debug('Running decision skill', skill.key, args);

			const {
				text, //
				toolCalls,
				finishReason,
				usage,
				warnings,
				providerMetadata,
				//
			} = await _askMagicRock(context);

			console.debug('Provider metadata', providerMetadata);

			const reactions = [] as Array<z.infer<typeof newActionSchema>>;

			// prettier-ignore
			const say = (text: string) => reactions.push({
				skillKey: 'say',
				args: { message: text },
				taskId: task._id,
				author: action._id,
				owner: task.owner,
				depth: action.depth + 1,
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
							depth: action.depth + 1,
						})),
					);
					break;

				// prettier-ignore
				case 'stop': say(text); break;

				// prettier-ignore
				case 'error': say(text); break;

				// prettier-ignore
				case 'content-filter': say(`[damn @sama] Content filter hit: ${warnings}`); break;

				// TODO: better handling of max length
				// prettier-ignore
				case 'length': say(`Max length hit: ${warnings}`); break;

				// prettier-ignore
				default: throw new Error(`Unknown finish reason: ${finishReason}`);
			}

			if (warnings?.length) console.warn('Decision skill warnings', warnings);

			return {
				result: {
					reactions,
				},
				costs: [
					{
						symbol: 'USD',
						amount: calculateProviderCost({
							model: skill.config.model,
							inputTokens: { uncached: usage.promptTokens },
							outputTokens: { uncached: usage.completionTokens },
						}),
						description: 'Provider cost',
					},
					{
						symbol: 'USD',
						amount: env.ACTION_COST_USD,
						description: 'Meseeks action (included on your plan)',
					},
				],
			};
		},
	});
}

export function estimateCostFor(
	skill: z.infer<typeof skillSchema>, //
	actionId: Id<'actions'>,
	context?: MagicRockContext,
) {
	//
	if (skill.cost !== 'dynamic') return skill.cost;
	if (!context) throw new Error('Context is required for dynamic cost estimation');

	const instructionsLength = context.system?.length ?? 0;
	const toolsLength = computeToolsLength(context.tools);
	const historyLength = computeHistoryLength(context.messages as Array<CoreMessage>);

	const inputLength = instructionsLength + toolsLength + historyLength;

	const inputTokens = Math.ceil(inputLength / env.CHAR_PER_TOKEN);
	const outputTokens = Math.min(8000, Math.ceil(inputTokens / 2)); // half as input, capped at 8000, TODO: improve

	// assume worst-cast scenario with no cached tokens
	const providerCost = calculateProviderCost({
		model: skill.config.model,
		inputTokens: { uncached: inputTokens },
		outputTokens: { uncached: outputTokens },
	});

	const actionCost = env.ACTION_COST_USD;
	const totalCost = providerCost + actionCost;

	// add a fixed margin to account for unpredictable costs and bad math
	const marginPercent = env.COST_PREDICTION_MARGIN / 100;
	const marginFactor = 100n + BigInt(Math.round(marginPercent * 100));
	const totalCostWithMargin = (totalCost * marginFactor) / 100n;

	console.debug(
		`Estimated cost for ${skill.key} (${actionId}): ${asDollars({ bigInt: totalCostWithMargin, precision: 6 })} USD`,
	);
	console.debug(`Input tokens: ${inputTokens}`);
	console.debug(`Output tokens: ${outputTokens}`);

	return totalCostWithMargin;
}

export function calculateProviderCost({
	model, //
	inputTokens,
	outputTokens,
}: {
	model: z.infer<typeof modelsSchema>;
	inputTokens: {
		uncached: number;
		cached?: number;
	};
	outputTokens: {
		uncached: number;
		cached?: number;
	};
}) {
	// TODO: account for cached tokens
	// inspect loggged providerMetadata to get the cached tokens path
	const pricing = pricingFor(model);

	console.debug('Input tokens', inputTokens);
	console.debug('Output tokens', outputTokens);

	const inputCost = BigInt(inputTokens.uncached) * pricing.inputToken;
	const outputCost = BigInt(outputTokens.uncached) * pricing.outputToken;
	const totalProviderCost = inputCost + outputCost;

	console.debug('Decision provider cost', asDollars({ bigInt: totalProviderCost, precision: 6 }));
	console.debug('Action cost', asDollars({ bigInt: env.ACTION_COST_USD, precision: 6 }));

	return totalProviderCost;
}

function computeToolsLength(toolSet?: ToolSet) {
	//
	if (!toolSet) return 0;

	let length = 0;

	// ToolSet is an object, so we need to iterate over its values
	for (const key in toolSet) {
		const tool = toolSet[key];
		length += tool.description?.length ?? 0;
		length += typeof tool.parameters === 'string' ? tool.parameters.length : 0;
	}

	return length;
}

function computeHistoryLength(messages: Array<CoreMessage>) {
	return messages.reduce((acc, message) => acc + message.content.length, 0);
}

export function pricingFor(model: z.infer<typeof modelsSchema>): {
	inputToken: bigint;
	outputToken: bigint;
} {
	//
	switch (model) {
		//
		case 'anthropic/claude-3.7-sonnet':
			return {
				inputToken: asBigInt({ dollars: 3 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 15 }) / 1_000_000n,
			};

		case 'anthropic/claude-3.5-haiku':
			return {
				inputToken: asBigInt({ dollars: 0.8 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 4 }) / 1_000_000n,
			};

		case 'openai/gpt-4o':
			return {
				inputToken: asBigInt({ dollars: 2.5 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 10 }) / 1_000_000n,
			};

		case 'openai/gpt-4o-mini':
			return {
				inputToken: asBigInt({ dollars: 0.15 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 0.6 }) / 1_000_000n,
			};

		case 'google/gemini-2.0-flash':
			return {
				inputToken: asBigInt({ dollars: 0.1 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 0.4 }) / 1_000_000n,
			};

		case 'deepseek/v3':
			return {
				inputToken: asBigInt({ dollars: 0.27 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 1.1 }) / 1_000_000n,
			};

		case 'deepinfra/deepseek-v3':
			return {
				inputToken: asBigInt({ dollars: 0.4 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 0.89 }) / 1_000_000n,
			};

		case 'together/llama-4-maverick':
			return {
				inputToken: asBigInt({ dollars: 0.27 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 0.85 }) / 1_000_000n,
			};

		case 'groq/llama-4-scout':
			return {
				inputToken: asBigInt({ dollars: 0.11 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 0.34 }) / 1_000_000n,
			};

		case 'groq/llama-4-maverick':
			return {
				inputToken: asBigInt({ dollars: 0.2 }) / 1_000_000n,
				outputToken: asBigInt({ dollars: 0.6 }) / 1_000_000n,
			};
	}
}
