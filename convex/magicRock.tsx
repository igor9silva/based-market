import { openai } from '@ai-sdk/openai';
import { CoreMessage, CoreTool, generateObject, generateText, NoSuchToolError } from 'ai';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { ActionCtx } from './_generated/server';
import { authorSchema } from './schemas/authorSchema';
import { env } from './schemas/envSchema';
import { _toolsForMagicRock } from './tools/private';

// TODO: move to DB
export async function _askMagicRock(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	instructions: string,
) {
	const {
		finishReason, //
		text,
		toolCalls,
		// toolResults,
		usage,
		warnings,
		response,
	} = await generateText({
		model: openai('gpt-4o'),
		maxSteps: 1,
		temperature: 0.7,
		system: [
			//
			instructions,
			//
			// TODO: dynamic user info based on Inbox
			`## User information`,
			`- Language: I speak English (advanced, preferred), Portuguese (native) and a little bit of Spanish.`,
			`- Location: I live in Setúbal, Portugal.`,
			`- Timezone: UTC.`, // TODO: dynamic timezone because of the damn DST
			`- Current time: ${new Date().toISOString()}`,
			`- Name: Igor Silva`,
			`- Twitter: @igor9silva`,
			`- Birthday: 1997-01-22 (aged 27 as of today)`,
			`- He is your creator. He's actively working on improving you (Meseeks, the app).`,
			``,
			//
			`## The task`,
			promptForTask(task),
			//
		].join('\n'),

		// assuming task.author is always an user, could also use action.author since we're replying to a user message
		messages: await renderHistory(ctx, task._id, task.author),
		tools: await loadTools(ctx, task),
		toolChoice: 'required',

		experimental_repairToolCall: async ({ toolCall, tools, parameterSchema, error, messages, system }) => {
			//
			if (NoSuchToolError.isInstance(error)) {
				return null; // do not attempt to fix invalid tool names
			}

			console.debug('repairToolCall', toolCall);

			// TODO: trace this call, maybe aggregate to the action usage data

			const tool = tools[toolCall.toolName as keyof typeof tools];

			const { object: repairedArgs } = await generateObject({
				model: openai('gpt-4o', { structuredOutputs: true }),
				schema: tool.parameters,
				prompt: [
					`The model tried to call the tool "${toolCall.toolName}"` + ` with the following arguments:`,
					JSON.stringify(toolCall.args),
					`The tool accepts the following schema:`,
					JSON.stringify(parameterSchema(toolCall)),
					'Please fix the arguments.',
				].join('\n'),
			});

			return { ...toolCall, args: JSON.stringify(repairedArgs) };
		},
	});

	const result = {
		finishReason,
		text,
		toolCalls,
		usage,
		warnings,
	};

	console.debug('askMagicRock', result);

	return result;
}

function actionToCoreMessage(
	action: Doc<'actions'>, //
	author: 'user' | 'assistant',
): CoreMessage | Array<CoreMessage> | undefined {
	//
	switch (action.kind) {
		//
		case 'async':
			//
			if (!action.result) return undefined; // TODO: maybe just filter out `skipped` ones

			return [
				{
					role: 'assistant',
					content: [
						{
							type: 'tool-call',
							toolCallId: action._id,
							toolName: action.toolKey,
							args: action.args,
						},
					],
				},
				{
					role: 'tool',
					content: [
						{
							type: 'tool-result',
							toolCallId: action._id,
							toolName: action.toolKey,
							result: action.result,
							isError: action.status === 'failed',
						},
					],
				},
			];

		case 'sync':
			// TODO: new render
			return {
				role: author,
				content: [
					`<date>${new Date(action._creationTime).toISOString()}</date>`,
					// `<kind>${action.kind}</kind>`,
					`<content>${action.result}</content>`,
				].join('\n'),
			};
	}
}

async function loadTools(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
): Promise<Record<string, CoreTool>> {
	//
	console.debug('loadTools');

	const tools = await _toolsForMagicRock(ctx, task);

	console.debug('loaded tools', Object.keys(tools));

	return tools;
}

// TODO: persist a copy of the messages in CoreMessage format? or it gets too big?
async function renderHistory(
	ctx: ActionCtx, //
	taskId: Id<'tasks'>,
	author: z.infer<typeof authorSchema>,
): Promise<Array<CoreMessage>> {
	//
	const actions = await ctx.runQuery(internal.action.private._findAll, { taskId });

	const history = actions
		.map((action) => ({ action, author: author === action.author ? ('user' as const) : ('assistant' as const) }))
		.map(({ action, author }) => actionToCoreMessage(action, author))
		.filter((action): action is CoreMessage => action !== undefined)
		.flatMap((message) => message);

	console.debug('renderHistory', history);

	// validateHistory(history);

	console.debug('renderHistory validated');

	return history;
}

function validateHistory(history: Array<CoreMessage>): Array<CoreMessage> {
	//
	const maxConsecutiveCompanionActions = env.MAX_CONSECUTIVE_COMPANION_ACTIONS;
	const lastMessages = history.filter((message) => message.role !== 'tool').slice(-maxConsecutiveCompanionActions);

	// throw if Companion did >= {maxConsecutiveCompanionActions}
	if (lastMessages.every((message) => message.role === 'assistant')) {
		throw new Error(`Too many (${maxConsecutiveCompanionActions}) consecutive companion actions.`);
	}

	return history;
}

// TODO: a more robust one
const promptForTask = (task: Doc<'tasks'>) =>
	[
		`<id>${task._id}</id>`, //
		`<title>${task.title}</title>`,
		`<body>${task.body}</body>`,
		`<createdAt>${new Date(task._creationTime).toISOString()}</createdAt>`,
	].join('\n');
