'use node';

import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { updateTask } from './updateTask';

const metadata = {
	description: 'Minify the task description to fit in a tweet.',
	parameters: z.object({
		description: z.string(),
	}),
};

export const minifyDescription = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ description }) => {
			//
			console.debug('Minifying task:', task._id);

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
					`You'll receive a description, and your job is to make it fit in a tweet.`,
					`The output must be under 280 characters.`,
					`You can use techniques to shorten text like removing unnecessary words, using abbreviations, emojis, etc.`,
					`Keep only what's essential - remove anything that's not necessary or useful.`,
					`Make sure to preserve all important information while making it concise.`,
					`You MUST use the updateTask tool to provide the shortened version.`,
					`Reply confirming the update was successful (or the error details).`,
				].join('\n'),
				prompt: `Current task description:\n${description}`,
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
