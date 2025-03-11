import { openai } from '@ai-sdk/openai';
import { CoreMessage, generateText, Tool } from 'ai';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc } from './_generated/dataModel';
import { ActionCtx, MutationCtx } from './_generated/server';
import { softSkillSchema } from './schemas/skillSchema';
import { _toolsForMagicRock } from './skills/tools';
import { asDollars } from './utils/money';

// TODO: move to DB
export async function _askMagicRock(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
) {
	const {
		finishReason, //
		text,
		toolCalls,
		// toolResults,
		// steps,
		usage,
		warnings,
		// response,
		reasoning,
		reasoningDetails,
		providerMetadata,
		//
	} = await generateText({
		// model: anthropic('claude-3-7-sonnet-20250219'), // <---- AGI
		model: openai('gpt-4o', {
			parallelToolCalls: false, // TODO: in order to support performing actions in parallel, we first need a proper CoA with aggregated statuses
		}), // 2nd best
		// model: anthropic('claude-3-5-haiku-20241022'), // ok, but very far from Sonnet
		// model: deepseek('deepseek-chat'), // complete failure, reasoner can't call tools
		// model: google('gemini-2.0-flash-001'), // useful for some tools, can search using Google
		// model: openai('o3-mini', { // suprisingly bad, worse than GPT-4o on every test
		// 	reasoningEffort: 'low',
		// 	structuredOutputs: false, // if setting to true, it gets more strict on tool schemas and disable parallel tool calls
		// }),
		maxTokens: skill.config.maxTokens ?? undefined,
		maxSteps: 1,
		temperature: skill.config.temperature ?? 0,
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
			promptForTask(task),
			//
		].join('\n'),

		// assuming task.author is always an user, could also use action.author since we're replying to a user message
		messages: await renderHistory(ctx, task, action),
		tools: await loadTools(ctx, task, action, skill),
		toolChoice: 'required',

		// experimental_repairToolCall: async ({ toolCall, tools, parameterSchema, error, messages, system }) => {
		// 	//
		// 	if (NoSuchToolError.isInstance(error)) {
		// 		return null; // do not attempt to fix invalid tool names
		// 	}

		// 	// TODO: 2025-02-24 not yet sure how to handle broken tool calls
		// 	// hard to just sum usage, also hard to predict, might go over budget
		// 	// hard to split into a second action
		// 	// TODO: trace this call, maybe aggregate to the action usage data

		// 	console.debug('repairToolCall', toolCall);

		// 	const tool = tools[toolCall.toolName as keyof typeof tools];

		// 	const {
		// 		object: repairedArgs,
		// 		usage,
		// 		warnings,
		// 	} = await generateObject({
		// 		model: openai('gpt-4o', { structuredOutputs: true }),
		// 		schema: tool.parameters,
		// 		prompt: [
		// 			`The model tried to call the tool "${toolCall.toolName}"` + ` with the following arguments:`,
		// 			JSON.stringify(toolCall.args),
		// 			`The tool accepts the following schema:`,
		// 			JSON.stringify(parameterSchema(toolCall)),
		// 			'Please fix the arguments.',
		// 		].join('\n'),
		// 	});

		// 	return { ...toolCall, args: JSON.stringify(repairedArgs) };
		// },
	});

	const result = {
		finishReason,
		text,
		toolCalls,
		usage,
		warnings,
		reasoning,
		reasoningDetails,
		providerMetadata,
	};

	console.debug('askMagicRock', result);

	return result;
}

// TODO: new render
function actionToCoreMessage(
	action: Doc<'actions'>, //
	author: 'user' | 'assistant',
): CoreMessage | Array<CoreMessage> | undefined {
	//
	return {
		role: author,
		content: [
			`<date>${new Date(action._creationTime).toISOString()}</date>`,
			`<skill>${action.skillKey}</skill>`,
			`<status>${action.status}</status>`,
			`<content>${action.result}</content>`,
		].join(''),
	};
}

async function loadTools(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof softSkillSchema>,
): Promise<Record<string, Tool>> {
	//
	console.debug('loading tools, config:', skill.config.availableSkills);

	const allTools = await _toolsForMagicRock(ctx, task, action);

	if (skill.config.availableSkills === 'auto') {
		console.debug('loaded all tools');
		return allTools;
	}

	// TODO: optimize
	const tools = Object.fromEntries(
		Object.entries(allTools).filter(([key]) => skill.config.availableSkills.includes(key)),
	);

	console.debug('loaded tools', Object.keys(tools));

	return tools;
}

// TODO: persist a copy of the messages in CoreMessage format? or it gets too big?
async function renderHistory(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
): Promise<Array<CoreMessage>> {
	//
	const actions = await ctx.runQuery(internal.action.private._findAllSince, {
		taskId: task._id,
		since: task.lastSummarizedAt ?? 0,
	});

	const history = actions
		// .filter((action) => action.skillKey !== 'react')
		.filter((action) => ['succeeded', 'failed'].includes(action.status))
		.filter((a) => a._id !== action._id) // doesn't include the current action
		.map((action) => ({
			action,
			author:
				task.owner === action.author
					? ('user' as const) //
					: ('assistant' as const),
		}))
		.map(({ action, author }) => actionToCoreMessage(action, author))
		.filter((action): action is CoreMessage => action !== undefined)
		.flatMap((message) => message);

	// history.push(
	// 	...actions
	// 		.filter((action) => action.skillKey !== 'react')
	// 		.filter((action) => action.status !== 'skipped')
	// 		.map((action) => ({
	// 			action,
	// 			author: author === action.author ? ('user' as const) : ('assistant' as const),
	// 		}))
	// 		.map(({ action, author }) => actionToCoreMessage(action, author))
	// 		.filter((action): action is CoreMessage => action !== undefined)
	// 		.flatMap((message) => message),
	// );

	// history will be empty right after an updateTask(), so we artificially add a temporary user message to keep going
	// if (history.length === 0) {
	// 	history.push({
	// 		role: 'user',
	// 		content: 'keep going',
	// 	});
	// }

	// const final = [
	// 	{
	// 		role: 'user' as const,
	// 		content: [
	// 			`### Current task`, //
	// 			promptForTask(task),
	// 		].join('\n'),
	// 	},
	// 	...history,
	// ];

	console.debug(`renderHistory since ${new Date(task.lastSummarizedAt ?? 0).toISOString()}`, history);

	// validateHistory(history); we're now validating before add react() action, TODO: revist this

	// console.debug('renderHistory validated');

	return history;
}

// function validateHistory(history: Array<CoreMessage>): Array<CoreMessage> {
// 	//
// 	const maxConsecutiveCompanionActions = env.MAX_CONSECUTIVE_COMPANION_ACTIONS;
// 	const lastMessages = history.filter((message) => message.role !== 'tool').slice(-maxConsecutiveCompanionActions);

// 	// throw if Companion did >= {maxConsecutiveCompanionActions}
// 	if (lastMessages.every((message) => message.role === 'assistant')) {
// 		throw new Error(`Too many (${maxConsecutiveCompanionActions}) consecutive companion actions.`);
// 	}

// 	return history;
// }

// TODO: a more robust one
const promptForTask = (task: Doc<'tasks'>) =>
	[
		`<id>${task._id}</id>`, //
		`<title>${task.title}</title>`,
		`<details>${task.details}</details>`,
		// `<status>${task.status}</status>`,
		`<createdAt>${new Date(task._creationTime).toISOString()}</createdAt>`,
		`<lastUpdatedAt>${dateOrNever(task.lastUpdatedAt)}</lastUpdatedAt>`,
		`<lastSummarizedAt>${dateOrNever(task.lastSummarizedAt)}</lastSummarizedAt>`,
		`<budgetUSDC>
			<total alt="Total money user has budgeted for this task">${asDollars({ bigInt: task.budgetUSDC.total })}</total>
			<spent alt="Amount already spent from the budget">${asDollars({ bigInt: task.budgetUSDC.total - task.budgetUSDC.available })}</spent>
			<available alt="Remaining money available to resolve this task">${asDollars({ bigInt: task.budgetUSDC.available })}</available>
		</budgetUSDC>`,
		// `<parentId>${task.parentId}</parentId>`,
	].join('\n');

function dateOrNever(date: number | undefined) {
	return date ? new Date(date).toISOString() : 'never';
}
