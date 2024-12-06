'use node';

import { openai } from '@ai-sdk/openai';
import { CoreMessage, generateText } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { ActionCtx } from './_generated/server';
import { internalAction } from './lib';
import { authorSchema } from './schemas/authorSchema';
import { _runNextActionIfNeeded, _setActionStatus } from './taskActions';
import { _addMeseeksToolCall, _sendMeseeksMessage } from './taskEvents';
import { coreTools, promptForTask } from './tools';

export const _think = internalAction({
	args: {
		author: authorSchema,
		taskId: zid('tasks'),
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, author }) => {
		//
		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		try {
			// invoke magic rock
			const result = await invokeMagicRock(ctx, task, action);

			switch (result.finishReason) {
				//
				case 'tool-calls':
					//
					if (result.toolCalls.length !== 1) throw new Error('Expected one tool call.');

					// TODO: think about multiple tool calls
					const toolCalls = await Promise.allSettled(
						result.toolCalls.map((call) =>
							_addMeseeksToolCall(ctx, {
								taskId: task._id,
								author: action._id,
								toolName: call.toolName,
								toolCallId: call.toolCallId,
								args: call.args,
							}),
						),
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

async function invokeMagicRock(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
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
		system: [
			`You're the most helpful assistant on earth, Meseeks.`,
			`Meseeks knows everything about the user, so it feels like a clone.`,
			`Meseeks also has access to the same tools as the user.`,
			`Meseeks' access to all user knowledge combined with all user tools makes it incredibly powerful.`,
			`You are Meseeks, act accordingly.`,
			`What you reply will be sent to the user. You may choose to say nothing.`,
			//
			`## Context`,
			`User is talking to you inside a task (anything he wants to achieve is a task).`,
			`The task is the object of the conversation.`,
			`You're solving the request the user did on their last message.`,
			`You'll be invoked everytime something happens on the task. e.g. everytime it's updated, or there is a new message - INCLUDING YOURS!!!`,
			`If you have nothing to say, say nothing.`,
			`If you are not sure what is expected, just ask.`,
			`Never repeat yourself. If you see a message from you, maybe it's done and you should say nothing.`,
			`If you see an empty message from yourself, it means your previous invocation decided it has nothing to say or do.`,
			`If the last message is a tool call, it's likely that you are expecting that result to proceed.`,
			//
			`## Notes`,
			`When updating the task, you should think of it as a TASK.`,
			`	i.e. the title and description should contain details of what the user expects to achieve, plus any other relevant information to it.`,
			`	Por este motivo, as informações devem aparecer sempre no *imperativo*.`,
			`	exemplo CORRETO: 'Shave body' (as in 'the user wants to shave their body')`,
			`	exemplo CORRETO: 'Learn to shave body' (as in 'the user wants to learn how to shave their body')`,
			`	exemplo INCORRETO: 'How to shave body'`,
			`You see messages in the following format:`,
			'```',
			`<date>ISO8601 date</date>`,
			`<kind>message|mutation</kind>`,
			`<content>message content</content>`,
			'```',
			`The date is when the action ocurred.`,
			`Kind 'message' means the user or you sent a text (Markdown Components/MDX) message.`,
			`Kind 'mutation' means a change was made to the task by either you or the user.`,
			`The message content will always be Markdown Components/MDX-compatible. Feel free to use it as you see fit.`,
			`>>>Note that you should NOT use the above format for your messages, as it'll be formated latter by the system. Reply with JUST MDX-compatible text!<<<`,
			``,
			//
			// TODO: dynamic user info
			`User information:`,
			`- Language: I speak English (advanced), Portuguese (native) and a little bit of Spanish.`,
			`- Location: I live in Setúbal, Portugal.`,
			`- Timezone: UTC.`, // TODO: dynamic timezone because of the damn DST
			`- Current time: ${new Date().toISOString()}`,
			`- Name: Igor Silva`,
			`- Twitter: @igor9silva`,
			`- Birthday: 1997-01-22 (age 27)`,
			//
			`## Task as of now`,
			promptForTask(task),
			//
		].join('\n'),

		// assuming task.owner is always an user, could also use action.author since we're replying to a user message
		messages: await renderHistory(ctx, task._id, task.owner),
		tools: coreTools(ctx, task),

		onStepFinish({ text, toolCalls, toolResults, finishReason, usage, warnings, isContinued, stepType }) {
			//
			// const messages = toolCalls.map((call) => eventToCoreMessage(call, 'assistant'));
			console.debug('onStepFinish', {
				stepType,
				finishReason,
				text,
				usage,
				warnings,
				isContinued,
				toolCalls,
				toolResults,
			});
		},
	});

	const result = {
		finishReason,
		text,
		toolCalls,
		usage,
		warnings,
	};

	console.debug('responseMessages', JSON.stringify(response.messages, null, 2));
	console.debug('replyToUser', result);

	return result;
}

function eventToCoreMessage({
	event,
	author,
}: {
	event: Doc<'taskEvents'>;
	author: 'user' | 'assistant';
}): CoreMessage | Array<CoreMessage> | undefined {
	//
	switch (event.kind) {
		//
		case 'tool-call':
			//
			if (!event.result) return undefined; // TODO: maybe just filter out `skipped` ones

			return [
				{
					role: 'assistant',
					content: [
						{
							type: 'tool-call',
							toolCallId: event.toolCallId,
							toolName: event.toolName,
							args: event.args,
						},
					],
				},
				{
					role: 'tool',
					content: [
						{
							type: 'tool-result',
							toolCallId: event.toolCallId,
							toolName: event.toolName,
							result: event.result,
							isError: event.isError,
						},
					],
				},
			];

		case 'message':
		case 'mutation':
			return {
				role: author,
				content: [
					`<date>${new Date(event._creationTime).toISOString()}</date>`,
					`<kind>${event.kind}</kind>`,
					`<content>${event.kind === 'message' ? event.message : event.changes}</content>`,
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
	const events = await ctx.runQuery(internal.taskEvents._findAll, { taskId });

	const history = events
		.map((event) => ({ event, author: event.author === userId ? ('user' as const) : ('assistant' as const) }))
		.map(eventToCoreMessage)
		.filter((event): event is CoreMessage => event !== undefined);

	console.debug('renderHistory', history);

	return history.flatMap((message) => message);
}
