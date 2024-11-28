'use node';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { promptForTask } from '.';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import updateTask from '../tools/updateTask';

export default async function fill(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) {
	console.debug('Filling task:', task);

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
		maxSteps: 1,
		system: [
			`You'll receive a user-created task, and your job is to fix and improve it.`,
			`You should fill everything possible based on info already in the task, plus:`,
			`- everything else you know`,
			`- anything you can infer`,
			`- anything you can find on the web`,
			`You MUST use the updateTask tool to provide the improved title and body.`,
			`Reply confirming the update was successful (or not).`,
		].join('\n'),
		prompt: promptForTask(task),
		toolChoice: 'required',
		tools: {
			updateTask: updateTask(ctx, task._id),
		},
	});

	if (toolResults.length > 1) {
		console.warn('More than one tool call is not expected.');
	} else if (toolResults.length === 0) {
		console.warn('Tool call was expected.');
		throw new Error('Tool call was expected.');
	}

	const updated = toolResults.at(0)?.result;

	if (!updated) {
		console.warn('Tool result was expected.');
		throw new Error('Tool result was expected');
	}

	console.debug({
		text,
		finishReason,
		toolCalls,
		toolResults,
		// steps,
		usage,
		warnings,
	});

	return text;
}
