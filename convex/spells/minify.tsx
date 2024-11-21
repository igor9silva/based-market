'use node';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { promptForTask } from '.';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

export default async function minify(ctx: ActionCtx, task: Doc<'tasks'>, action: Doc<'taskActions'>) {
	//
	const { object } = await generateObject({
		model: openai('gpt-4o'),
		// TODO: think about how to use the same schema
		schema: z.object({
			title: z.string(),
			body: z.string(),
		}),
		system: [
			`You'll receive a user-created task, and your job is to make it shorter.`,
			`Users will usually only fill-in the 'title', and with very few details.`,
			`You should remove everything possible that's not necessary, and that's not useful.`,
			`Make sure to not lose any important information.`,
		].join('\n'),
		prompt: promptForTask(task),
	});

	// update the task
	await ctx.runMutation(internal.tasks._update, {
		taskId: task._id,
		title: object.title,
		body: object.body,
	});
}
