import { anthropic } from '@ai-sdk/anthropic';
import { deepseek } from '@ai-sdk/deepseek';
import { google } from '@ai-sdk/google';
import { openai } from '@ai-sdk/openai';

import { CoreMessage, generateText, LanguageModel, Tool } from 'ai';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc } from './_generated/dataModel';
import { ActionCtx, MutationCtx } from './_generated/server';
import { softSkillSchema } from './schemas/skillSchema';
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
	return {
		model: languageModelFrom(skill),
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
		system: [
			//
			skill.config.instructions,
			//
			// TODO: dynamic user info based on Inbox
			`## Context`,
			`### User information`,
			`- Language: I speak English (advanced, preferred), BR Portuguese (native) and a little bit of Spanish.`,
			`- Location: I live in Setúbal, Portugal. I was born in São Paulo, Brazil.`,
			`- Timezone: UTC.`, // TODO: dynamic timezone because of the damn DST
			`- Current time: ${new Date().toISOString()}`,
			`- Name: Igor Silva`,
			`- Twitter: @igor9silva`,
			`- Birthday: 1997-01-22 (aged 28 as of today)`,
			`- Igor is your creator. He's actively working on improving you (Meseeks, the companion app).`,
			`- Igor is a software developer, entrepreneur and investor.`,
			//
			`### Current task`,
			renderTask(task),
			//
		].join('\n'),

		// assuming task.author is always an user, could also use action.author since we're replying to a user message
		messages: await renderHistory(ctx, task, action),
		tools: await loadTools(ctx, task, action, skill),
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
): Promise<Record<string, Tool>> {
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
			`<content>${action.result}</content>`,
		].join(''),
	};
}

async function renderHistory(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
): Promise<Array<CoreMessage>> {
	//
	const since = task.lastSummarizedAt ?? task.lastUpdatedAt ?? 0;
	const actions = await ctx.runQuery(internal.action.private._findAllSince, {
		taskId: task._id,
		since,
	});

	const history = actions
		// remove unfinished or skipped actions
		.filter((action) => ['succeeded', 'failed'].includes(action.status))
		// remove the current action
		.filter((a) => a._id !== action._id)
		// render
		.map((action) => renderAction(action, task.owner === action.author))
		// filter out undefined
		.filter((action) => action !== undefined)
		// flatten
		.flatMap((message) => message);

	console.debug(`rendered history since ${new Date(since).toISOString()}`, history);

	return history;
}

const dateOrNever = (date: number | undefined) => (date ? new Date(date).toISOString() : 'never');
const renderTask = (task: Doc<'tasks'>) =>
	[
		`<id>${task._id}</id>`, //
		`<title>${task.title}</title>`,
		// `<status>${task.status}</status>`,
		`<createdAt>${new Date(task._creationTime).toISOString()}</createdAt>`,
		`<lastUpdatedAt>${dateOrNever(task.lastUpdatedAt)}</lastUpdatedAt>`,
		`<lastSummarizedAt>${dateOrNever(task.lastSummarizedAt)}</lastSummarizedAt>`,
		`<budgetUSDC>
			<total alt="Total money user has budgeted for this task">${asDollars({ bigInt: task.budgetUSDC.total })}</total>
			<spent alt="Amount already spent from the budget">${asDollars({ bigInt: task.budgetUSDC.total - task.budgetUSDC.available })}</spent>
			<available alt="Remaining money available to resolve this task">${asDollars({ bigInt: task.budgetUSDC.available })}</available>
		</budgetUSDC>`,
		`<instructions>${task.instructions}</instructions>`,
		// `<parentId>${task.parentId}</parentId>`,
	].join('');
