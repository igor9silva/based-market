import { openai } from '@ai-sdk/openai';
import { CoreMessage, generateObject, generateText, NoSuchToolError } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { ActionCtx } from './_generated/server';
import { _addMeseeksToolCall, _runNextActionIfNeeded, _sendMeseeksMessage, _setActionStatus } from './actions';
import { internalAction } from './lib';
import { authorSchema } from './schemas/authorSchema';
import { env } from './schemas/env';
import { coreTools, promptForTask } from './tools';

export const _think = internalAction({
	args: {
		author: authorSchema,
		taskId: zid('tasks'),
		actionId: zid('actions'),
	},
	handler: async (ctx, { taskId, actionId, author }) => {
		//
		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.actions._findOne, { actionId });

		try {
			// invoke magic rock
			const result = await _askMagicRock(ctx, task, action);

			console.debug('magicRock/result/finishReason', result.finishReason);

			switch (result.finishReason) {
				//
				case 'tool-calls':
					//
					let calls = result.toolCalls;
					if (calls.length < 1) throw new Error('Expected at least one tool call.');

					if (calls[0].toolName === 'doNothing') {
						//
						console.debug('Doing nothing:', task._id);
						calls = calls.slice(1);

						if (calls.length > 0) throw new Error('Expected no more tool calls.');
						//
					}

					// TODO: think about parallelizing tool calls
					const toolCalls = await Promise.allSettled(
						calls.map(async (call) => {
							if (call.toolName === 'sendMessage') {
								await _sendMeseeksMessage(ctx, {
									taskId: task._id,
									actionId,
									message: call.args.message,
								});
							} else {
								await _addMeseeksToolCall(ctx, {
									taskId: task._id,
									author: action._id,
									toolName: call.toolName,
									toolCallId: call.toolCallId,
									args: call.args,
								});
							}
						}),
					);

					// TODO: notify errors
					toolCalls
						.filter((call) => call.status === 'rejected')
						.forEach((call) => {
							console.error('tool call failed', call.reason);
						});

					break;

				case 'stop':
					// if (result.text.length < 1) break;
					await _sendMeseeksMessage(ctx, {
						taskId: task._id,
						actionId,
						message: result.text,
					});
					break;

				case 'error':
					await _sendMeseeksMessage(ctx, {
						taskId: task._id,
						actionId,
						message: `Failed: ${result.text}`,
						isDone: true,
					});
					break;

				case 'content-filter':
					await _sendMeseeksMessage(ctx, {
						taskId: task._id,
						actionId,
						message: `[damn @sama] Content filter hit: ${result.warnings}`,
						isDone: true,
					});
					break;

				case 'length':
					// TODO: continue
					break;

				default:
					throw new Error(`Unknown finish reason: ${result.finishReason}`);
			}

			await _setActionStatus(ctx, { status: 'succeeded', actionId });
			await _runNextActionIfNeeded(ctx, { taskId, author });
			//
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			console.error('error in magic', errorMessage); // TODO: alert

			// TODO: update on the action itself (like we do on tools), instead of a plain message
			await _sendMeseeksMessage(ctx, { taskId: task._id, actionId, message: errorMessage, isDone: true });
			await _setActionStatus(ctx, { status: 'failed', actionId });

			throw error;
		}
	},
});

async function _askMagicRock(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
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
			`# Meseeks`,
			`You're the most helpful co-pilot on the solar system, Meseeks.`,
			// `Meseeks knows everything about the user, so it feels like a clone.`,
			`You have access to all tools the user has access to.`,
			`Your main goal is to decrease the user's cognitive load and work.`,
			`One of the best ways to decrease cognitive load is to be extremely succinct. Use as few words as possible, ALWAYS.`,
			`You should aim to act on behalf of the user, not to talk.`,
			`In fact, the less you talk, the better.`,
			`Everything inside Meseeks is MDX-compatible.`,
			`MDX = Markdown Components (i.e. regular Markdown + React components as JSX)`,
			`You can reply using MDX anytime. Specially if you want to render something more complex than a simple text.`,
			`After you are sure about the goal, try solving it.`,
			`You should keep iterating until you're comfortable to call "markAsDone".`,
			`If goal is not clear, or you're unable to solve it, ask the user for clarification or help.`,
			// `You have 3 possible responses: say something, say nothing or do something (call a tool).`,
			// `Most of the time you should say nothing, it's your call.`,
			// `You will have a chance to think every time something happens on the task (like you or the user says something, or a change is made to it).`,
			// `Do not reply to yourself!`,
			//
			`## Handling messages`,
			`Meseeks app is designed as a agent, i.e. everytime something happens on the thread, you'll be invoked.`,
			`That means you'll be able to 'think through' the thread as it evolves.`,
			`That DOES NOT mean you should reply to every message.`,
			`If the last message came from you (assistant), you should seriously consider doing nothing (there is a tool for that, call it).`,
			`If the last message came from the user (user), you should think about what to do or say next.`,
			`When you get a link, scrape it and use the content to update the task. Do it before anything else.`,
			`After doing mutations (such as updating the task or marking it as done), you should NOT say anything as the mutation will be clearly visible to the user.`,
			// `### Examples of how to behave`, // TODO: grab examples
			// `For the given task:`,
			// `messages: [
			// 	{
			// 		role: 'user',
			// 		content: 'Hello',
			// 	},
			// 	{
			// 		role: 'assistant',
			// 		content: 'Hello',
			// 	},
			// ]`,
			// ``,
			//
			`## Context`,
			`User is talking to you inside a "task", which is anything they want to achieve.`,
			`The task is the object of the conversation.`,

			// `You're solving the request the user did on their last message.`,
			// `If you have nothing to say, say nothing.`,
			// `If you are not sure what is expected, just ask.`,
			// `If you are not sure what what to do next, just ask.`,
			// `NEVER EVER repeat yourself.`,
			// `If you have already said something and got invoked again, it's NOT A BUG. Think what to do next and remember you can do nothing.`,
			//
			`## Notes`,
			`Meseeks is designed to first triage the task, then act on it.`,
			`If you are not sure what to do, just ask.`,
			`When updating the task, you should think of it as a TASK (i.e. something to be done or achieved).`,
			`	i.e. the title and description should contain details of what the user expects to achieve, plus any other relevant information to it.`,
			`	For this reason, the information should always appear in the *imperative*.`,
			`	CORRECT example: 'Clean the house' (as in 'the user wants to clean their house')`,
			`	CORRECT example: 'Learn to clean the house' (as in 'the user wants to learn how to clean their house')`,
			`	INCORRECT example: 'How to clean the house'`,
			`You ***see*** (BUT DO NOT WRITE) messages in the following format:`,
			'```',
			`<date>ISO8601 date</date>`,
			// `<kind>message</kind>`,
			`<content>message content</content>`,
			'```',
			`The date is when the message was sent/action ocurred.`,
			// `Kind 'message' means the user or you sent a text.`,
			// `Kind 'mutation' means a change was made to the task by either you or the user.`,
			`The message content is in MDX format.`,
			`>>>Note that you should NOT use the above format for your messages, as it'll be formated latter by the system. Reply with JUST MDX-compatible text!<<<`,
			``,
			//
			// TODO: dynamic user info
			`Your user (the other pilot) information:`,
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

		// assuming task.owner is always an user, could also use action.author since we're replying to a user message
		messages: await renderHistory(ctx, task._id, task.owner),
		tools: await coreTools(ctx, task),
		toolChoice: 'required',

		experimental_repairToolCall: async ({ toolCall, tools, parameterSchema, error, messages, system }) => {
			//
			if (NoSuchToolError.isInstance(error)) {
				return null; // do not attempt to fix invalid tool names
			}

			console.debug('repairToolCall', toolCall);

			// TODO: trace this call, maybe aggregate to the main call usage data

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
	console.debug('askMagicRock/responseMessages', JSON.stringify(response.messages, null, 2));

	return result;
}

function actionToCoreMessage({
	action,
	author,
}: {
	action: Doc<'actions'>;
	author: 'user' | 'assistant';
}): CoreMessage | Array<CoreMessage> | undefined {
	//
	switch (action.kind) {
		//
		case 'tool':
			//
			if (!action.result) return undefined; // TODO: maybe just filter out `skipped` ones

			return [
				{
					role: 'assistant',
					content: [
						{
							type: 'tool-call',
							toolCallId: action._id,
							toolName: action.key,
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
							toolName: action.key,
							result: action.result,
							isError: action.status === 'failed',
						},
					],
				},
			];

		case 'mutation':
			// TODO: new render
			return {
				role: author,
				content: [
					`<date>${new Date(action._creationTime).toISOString()}</date>`,
					`<kind>${action.kind}</kind>`,
					`<content>${action.result}</content>`,
				].join('\n'),
			};
	}
}

// TODO: persist a copy of the messages in CoreMessage format? or it gets too big?
async function renderHistory(
	ctx: ActionCtx, //
	taskId: Id<'tasks'>,
	userId: Id<'users'>,
): Promise<Array<CoreMessage>> {
	//
	const actions = await ctx.runQuery(internal.actions._findAll, { taskId });

	const history = actions
		.map((action) => ({ action, author: action.author === userId ? ('user' as const) : ('assistant' as const) }))
		.map(actionToCoreMessage)
		.filter((action): action is CoreMessage => action !== undefined)
		.flatMap((message) => message);

	console.debug('renderHistory', history);

	validateHistory(history);

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
