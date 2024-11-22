'use node';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { promptForTask } from '.';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { _addActionResultEvent } from '../taskEvents';

export default async function fill(ctx: ActionCtx, task: Doc<'tasks'>, action: Doc<'taskActions'>) {
	//
	const { object } = await generateObject({
		model: openai('gpt-4o'),
		// TODO: think about how to use the same schema
		schema: z.object({
			title: z.string(),
			body: z.string(),
		}),
		system: [
			`You'll receive a user-created task, and your job is to fix and improve it.`,
			`You should fill everything possible based on info already in the task, plus:`,
			`- everything else you know`,
			`- anything you can infer`,
			`- anything you can find on the web`,
		].join('\n'),
		prompt: promptForTask(task),
	});

	// update the task
	await ctx.runMutation(internal.tasks._update, {
		taskId: task._id,
		title: object.title,
		body: object.body,
	});

	await _addActionResultEvent(ctx, { taskId: task._id, action, result: 'Task updated' });
}
