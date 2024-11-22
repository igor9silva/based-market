'use node';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { promptForTask } from '.';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { _addActionResultEvent } from '../taskEvents';

export default async function factCheck(ctx: ActionCtx, task: Doc<'tasks'>, action: Doc<'taskActions'>) {
	//
	console.debug('Fact-checking task:', task);
	//
	const {
		text,
		finishReason,
		toolCalls,
		// toolResults,
		// steps,
		usage,
		warnings,
	} = await generateText({
		model: openai('gpt-4o'),
		maxSteps: 1,
		system: [
			`You'll receive a user-created task, and your job is to fact-check the information in the task.`,
			`Your answer will be attached to the task as the fact-checked information.`,
			`Reply with ONLY the fact-checked information.`,
		].join('\n'),
		prompt: promptForTask(task),
	});

	console.debug({
		text,
		finishReason,
		toolCalls,
		// toolResults,
		// steps,
		usage,
		warnings,
	});

	await _addActionResultEvent(ctx, { taskId: task._id, action, result: text });
}
