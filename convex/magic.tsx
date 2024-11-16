import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { v } from 'convex/values';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc } from './_generated/dataModel';
import { internalAction } from './_generated/server';
import { scheduleNextActionIfNeeded, setActionStatus } from './taskActions';

// TODO: move to DB
const ACTIONS = {
	fill(task: Doc<'tasks'>) {
		return {
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
		};
	},
	minify(task: Doc<'tasks'>) {
		return {
			model: openai('gpt-4o'),
			// TODO: think about how to use the same schema
			schema: z.object({
				title: z.string(),
				body: z.string(),
			}),
			prompt: [
				`You'll receive a user-created task, and your job is to make it shorter.`,
				`Users will usually only fill-in the 'title', and with very few details.`,
				`You should remove everything possible that's not necessary, and that's not useful.`,
				`Make sure to not lose any important information.`,
				``,
				`Here's the task:`,
				`ID: ${task._id}`,
				`Title: ${task.title}`,
				`Body: ${task.body}`,
				`Created at: ${task._creationTime}`,
			].join('\n'),
		};
	},
};

export const run = internalAction({
	args: {
		userId: v.id('users'),
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		// set action as 'running'
		await setActionStatus(ctx, { actionId, status: 'running' });

		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		// invoke magic rock
		const { object } = await generateObject(ACTIONS[action.kind](task));

		// update task
		await ctx.runMutation(internal.tasks._update, {
			taskId,
			title: object.title,
			body: object.body,
		});

		// set action as 'succeeded'
		await setActionStatus(ctx, { actionId, status: 'succeeded' });

		// schedule next action
		await scheduleNextActionIfNeeded(ctx, { taskId, userId });

		// TODO: error handling (notify me and set as 'failed' at least)
		// TODO: log/persist events
	},
});
