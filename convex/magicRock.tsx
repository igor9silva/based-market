import { anthropic } from '@ai-sdk/anthropic';
import { deepinfra } from '@ai-sdk/deepinfra';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

import { type CoreMessage, generateText, type LanguageModel } from 'ai';
import { z } from 'zod';
import { internal } from './_generated/api';
import type { Doc } from './_generated/dataModel';
import type { ActionCtx, MutationCtx } from './_generated/server';
import type { softSkillSchema } from './schemas/skillSchema';
import type { AITool } from './schemas/toolSchema';
import { _toolsForMagicRock } from './skills/tools';
import { asDollars } from './utils/money';

// >be human
// >dig shiny rocks from ground
// >grind rocks into powder
// >transform rock powder into rock wafers
// >enchant wafers with lightning
// >rocks can now do math
// >use rocks to exchange information globally
// >combine global information into new enchantments
// >rocks can think now
// >ask magic rock questions
// >magic rock knows everything
// >delegate all tasks to magic rocks
// >tfw automation achieves infinite productivity
// >singularity.png
// >mfw humanity peaked by tricking rocks into thinking

export type MagicRockContext = Parameters<typeof generateText>[0];

export async function _prepareContext(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
): Promise<MagicRockContext> {
	//
	const model = languageModelFrom(skill);
	const [history, tools, instructions] = await Promise.all([
		renderHistory(ctx, task, action, skill),
		loadTools(ctx, task, action, skill),
		renderInstructions(task, action, skill),
	]);

	console.debug('model', model.modelId, model.provider);
	console.debug('instructions', instructions);

	return {
		model,
		temperature: skill.config.temperature,
		maxTokens: skill.config.maxTokens ?? undefined,
		frequencyPenalty: skill.config.frequencyPenalty ?? undefined,
		maxRetries: skill.config.maxRetries ?? undefined,
		seed: skill.config.seed ?? undefined,
		topK: skill.config.topK ?? undefined,
		topP: skill.config.topP ?? undefined,
		stopSequences: skill.config.stopSequences ?? undefined,
		maxSteps: 1, // we are not using AI SDK to run tools or multi-step stuff
		toolChoice: 'required',
		system: instructions,
		messages: history,
		tools: tools,
	};
}

export async function _askMagicRock(args: MagicRockContext) {
	//
	const {
		finishReason,
		text,
		toolCalls,
		usage,
		warnings,
		providerMetadata,
		//
	} = await generateText(args);

	const result = {
		finishReason,
		text,
		toolCalls,
		usage,
		warnings,
		providerMetadata,
	};

	console.debug('askMagicRock', result);

	return result;
}

function languageModelFrom(skill: z.infer<typeof softSkillSchema>): LanguageModel {
	//
	switch (skill.config.model) {
		//
		case 'anthropic/claude-3.7-sonnet':
			return anthropic('claude-3-7-sonnet-20250219');

		case 'anthropic/claude-3.5-haiku':
			return anthropic('claude-3-5-haiku-latest');

		case 'openai/gpt-4o':
			return openai('gpt-4o', {
				parallelToolCalls: false, // TODO: in order to support performing actions in parallel, we first need a proper CoA with aggregated statuses
			});

		case 'openai/gpt-4o-mini':
			return openai('gpt-4o-mini', {
				parallelToolCalls: false, // TODO: in order to support performing actions in parallel, we first need a proper CoA with aggregated statuses
			});

		case 'google/gemini-2.0-flash':
			return google('gemini-2.0-flash-exp', {
				// TODO: using experimental model
				safetySettings: [
					{
						category: 'HARM_CATEGORY_UNSPECIFIED',
						threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
					},
					{
						category: 'HARM_CATEGORY_CIVIC_INTEGRITY',
						threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
					},
					{
						category: 'HARM_CATEGORY_HARASSMENT',
						threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
					},
					{
						category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
						threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
					},
					{
						category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
						threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
					},
					{
						category: 'HARM_CATEGORY_HATE_SPEECH',
						threshold: 'HARM_BLOCK_THRESHOLD_UNSPECIFIED',
					},
				],
			});

		case 'deepseek/v3':
			return deepseek('deepseek-chat');

		case 'deepinfra/deepseek-v3':
			// return groq('llama-3.3-70b-versatile'); // mei burro, mas tem potencial
			return deepinfra('deepseek-ai/DeepSeek-V3-0324'); // POTENCIAL
		// return togetherai('meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo');
		// return togetherai('google/gemma-2-27b-it');
		// return togetherai('Qwen/Qwen2.5-72B-Instruct-Turbo');
		// return togetherai('mistralai/Mistral-7B-Instruct-v0.3');
		// return togetherai('meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo');
		// return groq('deepseek-r1-distill-llama-70b');
		// return deepinfra('deepseek-ai/DeepSeek-R1');
		// return deepinfra('microsoft/Phi-4-multimodal-instruct');
		// return deepinfra('google/gemma-2-27b-it');
	}

	// model: anthropic('claude-3-7-sonnet-20250219'), // <---- AGI
	// model: openai('gpt-4o', { parallelToolCalls: false }), // 2nd best
	// model: google('gemma-3-27b-it'),
	// model: ollama('phi4-mini'),
	// model: ollama('gemma3:4b'),
	// model: anthropic('claude-3-5-haiku-20241022'), // ok, but very far from Sonnet
	// model: deepseek('deepseek-'), // complete failure, reasoner can't call tools
	// model: google('gemini-2.0-flash-001'), // useful for some tools, can search using Google
	// model: openai('o3-mini', { // suprisingly bad, worse than GPT-4o on every test
	// 	reasoningEffort: 'low',
	// 	structuredOutputs: false, // if setting to true, it gets more strict on tool schemas and disable parallel tool calls
	// }),
}

async function loadTools(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
): Promise<Record<string, AITool>> {
	//
	console.debug('loading tools, config:', skill.config.availableSkills);

	// TODO: optimize
	const allTools = await _toolsForMagicRock(ctx, task, action);
	const tools = Object.fromEntries(
		Object.entries(allTools).filter(([key]) => skill.config.availableSkills.includes(key)),
	);

	console.debug('loaded tools', Object.keys(tools));

	return tools;
}

async function renderHistory(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
): Promise<Array<CoreMessage>> {
	//
	const actions = await ctx.runQuery(internal.action.private._findLastActions, {
		taskId: task._id,
		amount: 25, // TODO: env
	});

	// TODO: add the summary as a message?

	const history = actions
		// remove unfinished or skipped actions
		// .filter((action) => ['succeeded', 'failed'].includes(action.status))
		// remove the current action
		.filter((a) => a._id !== action._id)
		// render
		.map((action) => renderAction(action, task.owner === action.author))
		// filter out undefined
		.filter((action) => action !== undefined)
		// flatten
		.flatMap((message) => message)
		// reverse to show the most recent actions last
		.reverse();

	console.debug(`rendered last ${actions.length} actions as history`, history);

	return history;
}

function renderAction(
	action: Doc<'actions'>, //
	isUser: boolean,
): CoreMessage | Array<CoreMessage> | undefined {
	//
	return {
		role: isUser ? 'user' : 'assistant',
		content: [
			`<date>${new Date(action._creationTime).toISOString()}</date>`,
			`<skill>${action.skillKey}</skill>`,
			`<status>${action.status}</status>`,
			`<result>${action.result?.text}</result>`,
			// `<cost>${action.costs.reduce}</cost>`,
		].join(''),
	};
}

function computeSince(
	task: Doc<'tasks'>, //
	skill: z.infer<typeof softSkillSchema>,
) {
	//
	switch (skill.config.historyMode) {
		//
		case 'since last summarized':
			return task.lastSummarizedAt ?? task.lastUpdatedAt ?? 0;

		case 'since last instructed':
			return task.lastUpdatedAt ?? 0;

		case 'all':
			return 0;
	}
}

async function renderInstructions(
	task: Doc<'tasks'>, //
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
) {
	//
	let result = skill.config.instructions;
	let prevResult = '';

	// continue replacing until no more variables to replace
	while (result !== prevResult) {
		//
		prevResult = result;

		// find all variables in the format {{variable}}
		result = result.replace(/\{\{([^{}]+)\}\}/g, (match, variableName) => {
			// replace with the value
			return valueForVariable(variableName.trim(), task, action);
		});
	}

	return result;
}

export const instructionVariableSchema = z.union([
	z.literal('task').describe('The full task structure, in a XML-like format'),
	z.literal('task.id'),
	z.literal('task.title'),
	z.literal('task.status'),
	z.literal('task.createdAt'),
	z.literal('task.lastUpdatedAt'),
	z.literal('task.lastSummarizedAt'),
	z.literal('task.instructions'),
	// z.literal('task.summary'),
	z.literal('task.parent'),
	z.literal('task.budgetUSDC').describe('The full task budget structure, in a XML-like format'),
	z.literal('task.budgetUSDC.total'),
	z.literal('task.budgetUSDC.spent'),
	z.literal('task.budgetUSDC.available'),
	z.literal('currentDate').describe('The current date and time in ISO 8601 format'),
	z.literal('userInfo').describe('Information about the user, written by themself'),
	// z.literal('input.instructions'),
]);

function valueForVariable(
	variable: z.infer<typeof instructionVariableSchema>, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
): string {
	//
	switch (variable) {
		//
		case 'task':
			return [
				`<id>{{task.id}}</id>`, //
				`<title>{{task.title}}</title>`,
				`<status>{{task.status}}</status>`,
				`<createdAt>{{task.createdAt}}</createdAt>`,
				`<lastUpdatedAt>{{task.lastUpdatedAt}}</lastUpdatedAt>`,
				`<lastSummarizedAt>{{task.lastSummarizedAt}}</lastSummarizedAt>`,
				`<budgetUSDC>{{task.budgetUSDC}}</budgetUSDC>`,
				`<instructions>{{task.instructions}}</instructions>`,
				// `<summary>{{task.summary}}</summary>`,
				// `<parent>${task.parent}</parent>`,
			]
				.join('')
				.replaceAll('\t', '');

		case 'task.id':
			return task._id;

		case 'task.title':
			return task.title ?? '<system>no title</system>';

		case 'task.status':
			return task.status;

		case 'task.createdAt':
			return dateOrNever(task._creationTime);

		case 'task.lastUpdatedAt':
			return dateOrNever(task.lastUpdatedAt);

		case 'task.lastSummarizedAt':
			return dateOrNever(task.lastSummarizedAt);

		case 'task.instructions':
			return task.instructions ?? '<system>no instructions</system>';

		// case 'task.summary':
		// 	return task.summary ?? '<system>no summary</system>';

		case 'task.parent':
			return task.parentId ?? '<system>no parent</system>';

		case 'task.budgetUSDC':
			return [
				`<total alt="Total money user has budgeted for this task, in USDC">{{task.budgetUSDC.total}}</total>`,
				`<spent alt="Amount already spent from the budget, in USDC">{{task.budgetUSDC.spent}}</spent>`,
				`<available alt="Remaining money available to resolve this task, in USDC">{{task.budgetUSDC.available}}</available>`,
			].join('');

		case 'task.budgetUSDC.total':
			return asDollars({ bigInt: task.budgetUSDC.total, precision: 10 });

		case 'task.budgetUSDC.spent':
			return asDollars({
				bigInt: task.budgetUSDC.total - task.budgetUSDC.available,
				precision: 10,
			});

		case 'task.budgetUSDC.available':
			return asDollars({ bigInt: task.budgetUSDC.available, precision: 10 });

		case 'currentDate':
			return new Date().toISOString();

		case 'userInfo': // TODO: read from preferences
			const MS_PER_YEAR = 31556952000;
			const birthdate = new Date('1997-01-22T03:36:00.000-02:00');
			const age = Math.floor((new Date().getTime() - birthdate.getTime()) / MS_PER_YEAR);
			return [
				`I'm Igor Silva, born at ${birthdate.toDateString()} (aged ${age} as of today) in São Paulo, Brazil.`,
				`Raised in Santos, São Paulo, where I lived until Nov/2023 when I moved to Setúbal, Portugal.`,
				`I'm both a portuguese and brazilian citizen.`,
				`I'm a engineer, entrepreneur and investor.`,
				`I speak English (advanced, preferred), BR Portuguese (native) and a little bit of Spanish.`,
				`My twitter handle is @igor9silva.`,
				`I'm the creator of Meseeks (you), the companion app. I'm actively working on improving it.`,
			].join('\n');

		// case 'input.instructions':
		// 	return action.args.instructions ?? '<system>no instructions</system>';

		default:
			throw new Error(`Unknown variable: ${variable}`);
	}
}

function dateOrNever(date: number | undefined) {
	//
	if (!date) return 'never' as const;

	return new Date(date).toISOString();
}
