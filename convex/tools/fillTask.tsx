'use node';

import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { promptForTask } from '../tools';
import { updateTask } from './updateTask';

const metadata = {
	description: 'Fill and improve all possible task fields based on info we know.',
	parameters: z.object({}),
};

export const fillTask = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'taskActions'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async () => {
			//
			console.debug('Filling task:', task._id);

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
					updateTask: updateTask(ctx, task, action),
				},
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
		},
	});
};
