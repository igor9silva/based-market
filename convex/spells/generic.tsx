'use node';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { promptForTask } from '.';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

export async function genericSpell(
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
		system: promptForTask(task),
		prompt: action.kind === 'message' ? action.message : action.changes,
	});

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
