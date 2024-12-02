'use node';

import { openai } from '@ai-sdk/openai';
import { CoreMessage, generateText } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { ActionCtx } from './_generated/server';
import { internalAction } from './lib';
import { _scheduleNextActionIfNeeded, _sendMeseeksMessage, _setActionStatus } from './taskActions';
import { coreTools, promptForTask } from './tools';

export const _run = internalAction({
	args: {
		userId: zid('users'),
		taskId: zid('tasks'),
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		try {
			// invoke magic rock
			const result = await invokeMagicRock(ctx, task, action);

			if (result.length > 0) {
				await _sendMeseeksMessage(ctx, { taskId: task._id, actionId, message: result });
			}

			await _setActionStatus(ctx, { status: 'succeeded', actionId });
			await _scheduleNextActionIfNeeded(ctx, { taskId, userId });
			//
		} catch (error) {
			//
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';

			console.error('error in magic', errorMessage); // TODO: alert

			await _sendMeseeksMessage(ctx, { taskId: task._id, actionId, message: errorMessage });
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
	switch (action.kind) {
		case 'message':
			return await replyToUser(ctx, task, action);
		case 'mutation':
			return ''; //TODO: handle mutations, do the magic
		default:
			throw new Error(`Unknown action kind`);
	}
}

async function replyToUser(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) {
	const {
		text,
		finishReason,
		toolCalls,
		toolResults,
		// steps,
		usage,
		warnings,
	} = await generateText({
		model: openai('gpt-4o'),
		maxSteps: 15,
		system: [
			`You're the most helpful assistant on earth, Meseeks.`,
			`Meseeks knows everything about the user, so it feels like a clone.`,
			`Meseeks also has access to the same tools as the user.`,
			`Meseeks' access to all user knowledge combined with all user tools makes it incredibly powerful.`,
			`You are Meseeks, act accordingly.`,
			`What you reply will be sent to the user. You may choose to say nothing.`,
			//
			// TODO: dynamic user info
			`User information:`,
			`- Language: I speak English (advanced), Portuguese (native) and a little bit of Spanish.`,
			`- Location: I live in Setúbal, Portugal.`,
			`- Timezone: UTC.`, // TODO: dynamic timezone because of the damn DST
			`- Current time: ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })}`,
			`- Name: Igor Silva`,
			`- Twitter: @igor9silva`,
			`- Birthday: 1997-01-22 (age 27)`,
			//
			`Context:`,
			`User is talking to you inside a task (anything he wants to achieve is a task).`,
			`The task is the object of the conversation.`,
			`When 'updating the taks', for example, you should think of it as a TASK.`,
			`i.e. the title and description should contain details of what should be done plus any other relevant information.`,
			`Por este motivo, as informações devem aparecer sempre no *imperativo*.`,
			`exemplo CORRETO: 'Shave body'`,
			`exemplo INCORRETO: 'How to shave body'`,
			//
			`Here's how the task looks like at the moment:`,
			promptForTask(task),
			//
			`If a message is tagged with <mutation>...</mutation>, it means a change was made to the task.`,
			`i.e. either you or the user used a tool to insert or update the task.`,
			`You should NEVER add a <mutation>...</mutation> tag to your message as it's done automatically by the system.`,
			//
		].join('\n'),
		messages: await buildHistory(ctx, task._id, task.owner), // assuming task.owner is always an user, could also use action.author since we're replying to a user message
		tools: coreTools(ctx, task, action),
	});

	console.debug('replyToUser', {
		text,
		finishReason,
		// toolCalls,
		toolResults,
		// steps,
		usage,
		warnings,
	});

	return text;
}

async function buildHistory(
	ctx: ActionCtx, //
	taskId: Id<'tasks'>,
	userId: Id<'users'>,
): Promise<Array<CoreMessage>> {
	//
	const actions = await ctx.runQuery(internal.taskActions._findAll, { taskId });

	const history = actions.map((action) => ({
		role: action.author === userId ? ('user' as const) : ('assistant' as const),
		content: action.kind === 'message' ? action.message : `<mutation>${action.changes}</mutation>`,
		// TODO: i'd like to send the action creationTime with each message as it may be useful,
		// but if I just send it as part of the content the model starts to mimic that behavior
		// and inadverdently replies with a timestamp in the message.
	}));

	console.debug('buildHistory', history);

	return history;
}
