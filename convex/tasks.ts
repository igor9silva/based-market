import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { api, internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { internalAction, mutation, query } from './_generated/server.js';

export const list = query(async (ctx) => {
	// TODO: from user
	return await ctx.db.query('tasks').collect();
});

type AddArgs = {
	title: string;
	body: string | undefined;
	owner: Id<'users'>;
};
export const add = mutation(async (ctx, { title, body, owner }: AddArgs) => {
	const taskId = await ctx.db.insert('tasks', { title, body, owner });

	// TODO: auto-schedule side effects
	// - fill
	// - learn
	// = suggest
	// - ...
});

export const findOne = query(async (ctx, { taskId }: { taskId: Id<'tasks'> }) => {
	const task = await ctx.db.get(taskId);
	if (!task) throw new Error('Task not found');

	return task;
});

export const update = mutation(
	async (
		ctx,
		{ taskId, title, body, effects }: { taskId: Id<'tasks'>; title: string; body: string; effects: string[] },
	) => {
		return await ctx.db.patch(taskId, { title, body, effects });
	},
);

export const startFilling = mutation(async (ctx, { taskId }: { taskId: Id<'tasks'> }) => {
	await ctx.db.patch(taskId, { effects: ['filling'] });
	await ctx.scheduler.runAfter(0, internal.tasks.fill, { taskId });
});

export const fill = internalAction(async (ctx, { taskId }: { taskId: Id<'tasks'> }) => {
	//
	const task = await ctx.runQuery(api.tasks.findOne, { taskId });
	if (!task) throw new Error('Task not found');

	const { object } = await generateObject({
		model: openai('gpt-4o'),
		// TODO: think about how to use the same schema
		schema: z.object({
			title: z.string(),
			body: z.string(),
		}),
		prompt: [
			`You'll receive a user-created task, and your job is to fix and improve it.`,
			`Users will usually only fill-in the 'title', and with very few details.`,
			`You should fill everything possible based on info already in the task, plus everything else you know, is able to infer or is able to find on the web.`,
			``,
			`Here's the task:`,
			`ID: ${task._id}`,
			`Title: ${task.title}`,
			`Body: ${task.body}`,
			`Created at: ${task._creationTime}`,
		].join('\n'),
	});

	// remove 'filling' effect
	const effects = task.effects?.filter((effect) => effect !== 'filling') ?? [];

	await ctx.runMutation(api.tasks.update, {
		taskId,
		title: object.title,
		body: object.body,
		effects: effects,
	});

	// TODO: log/persist events
});
