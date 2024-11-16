import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { v } from 'convex/values';
import { z } from 'zod';
import { api, internal } from './_generated/api';
import { Doc } from './_generated/dataModel.js';
import { internalAction, internalMutation, internalQuery, mutation, query } from './_generated/server.js';
import { taskActionKinds, taskActionStatuses } from './schema';

// TODO: from user (authorization)

export const list = query({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await ctx.db
			.query('taskActions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

export const findNextAction = internalQuery({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await ctx.db
			.query('taskActions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.filter((q) => q.eq(q.field('status'), 'pending'))
			.order('asc')
			.first();
	},
});

export const findRunningActions = internalQuery({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await ctx.db
			.query('taskActions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.filter((q) => q.eq(q.field('status'), 'running'))
			.collect();
	},
});

export const enqueue = mutation({
	args: {
		taskId: v.id('tasks'),
		kind: taskActionKinds,
	},
	handler: async (ctx, { taskId, kind }) => {
		console.debug('ENQUEUE, taskId', taskId, 'kind', kind);
		// I'm seeing a very odd behavior where reading from `currentUser` while breaks its type,
		// that's why I'm expliciting `Doc<'users'>` here.
		const currentUser: Doc<'users'> = await ctx.runQuery(api.users.currentUser);
		if (!currentUser) throw new Error('Not authenticated');

		const runningActions: Doc<'taskActions'>[] = await ctx.runQuery(
			internal.taskActions.findRunningActions, //
			{ taskId },
		);

		const actionId = await ctx.db.insert('taskActions', {
			owner: currentUser._id,
			taskId,
			kind,
			status: runningActions.length > 0 ? 'pending' : 'running', // important to avoid race condition
			isDone: false,
		});

		// if no running actions, run immediately
		if (runningActions.length === 0) {
			await ctx.scheduler.runAfter(
				0, //
				internal.taskActions[kind],
				{ taskId, actionId },
			);
		}
		console.debug('[END]  ENQUEUE, taskId', taskId, 'kind', kind);

		return actionId;
	},
});

// export const findOne = query(async (ctx, { taskId }: FindOneArgs) => {
// 	//
// 	const task = await ctx.db.get(taskId);
// 	if (!task) throw new Error('Task not found');

// 	return task;
// });

// export const update = mutation((ctx, { taskId, title, body }: UpdateArgs) => {
// 	return ctx.db.patch(taskId, { title, body });
// });

export const setStatus = internalMutation({
	args: {
		actionId: v.id('taskActions'),
		status: taskActionStatuses,
	},
	handler: async (ctx, { actionId, status }) => {
		await ctx.db.patch(actionId, {
			status,
			isDone: status === 'succeeded' || status === 'failed' || status === 'cancelled',
		});
	},
});

// ------------------------------------

export const nextAction = internalAction({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const nextAction = await ctx.runQuery(internal.taskActions.findNextAction, { taskId });
		if (!nextAction) return console.info('No pending action found for task', taskId);

		const runningActions = await ctx.runQuery(internal.taskActions.findRunningActions, { taskId });
		if (runningActions.length > 0) return console.info('Already running actions found for task', taskId);

		await ctx.scheduler.runAfter(
			0, //
			internal.taskActions[nextAction.kind],
			{ taskId, actionId: nextAction._id },
		);
	},
});

export const fill = internalAction({
	args: {
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId }) => {
		//
		const task = await ctx.runQuery(api.tasks.findOne, { taskId });
		if (!task) throw new Error('Task not found');

		await ctx.runMutation(internal.taskActions.setStatus, {
			actionId,
			status: 'running',
		});

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

		await ctx.runMutation(api.tasks.update, {
			taskId,
			title: object.title,
			body: object.body,
		});

		await ctx.runMutation(internal.taskActions.setStatus, {
			actionId,
			status: 'succeeded',
		});

		await ctx.scheduler.runAfter(
			0, //
			internal.taskActions.nextAction,
			{ taskId },
		);

		// TODO: error handling
		// TODO: log/persist events
	},
});

export const minify = internalAction({
	args: {
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId }) => {
		//
		const task = await ctx.runQuery(api.tasks.findOne, { taskId });
		if (!task) throw new Error('Task not found');

		await ctx.runMutation(internal.taskActions.setStatus, {
			actionId,
			status: 'running',
		});

		const { object } = await generateObject({
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
		});

		await ctx.runMutation(api.tasks.update, {
			taskId,
			title: object.title,
			body: object.body,
		});

		await ctx.runMutation(internal.taskActions.setStatus, {
			actionId,
			status: 'succeeded',
		});

		await ctx.scheduler.runAfter(
			0, //
			internal.taskActions.nextAction,
			{ taskId },
		);

		// TODO: error handling
		// TODO: log/persist events
	},
});
