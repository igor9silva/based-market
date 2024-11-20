import { v } from 'convex/values';
import { internalMutation, query } from './_generated/server';
import {
	actionRequestTaskEventSchema,
	actionResultErrorTaskEventSchema,
	actionResultSuccessTaskEventSchema,
	messageTaskEventSchema,
} from './schema';
import { ensureTaskOwner } from './tasks';

// Exposed -------------------------------------

export const findAll = query({
	args: { taskId: v.id('tasks') },
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskOwner(ctx, { taskId });

		return await ctx.db
			.query('taskEvents')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

// Internal (no authorization)------------------------------------
export const addActionRequest = internalMutation({
	args: actionRequestTaskEventSchema,
	handler: async (ctx, event) => {
		//
		console.debug('add event', event);
		return await ctx.db.insert('taskEvents', event);
	},
});

export const addActionResultError = internalMutation({
	args: actionResultErrorTaskEventSchema,
	handler: async (ctx, event) => {
		//
		console.debug('add event', event);
		return await ctx.db.insert('taskEvents', event);
	},
});

export const addActionResultSuccess = internalMutation({
	args: actionResultSuccessTaskEventSchema,
	handler: async (ctx, event) => {
		//
		console.debug('add event', event);
		return await ctx.db.insert('taskEvents', event);
	},
});

export const addMessage = internalMutation({
	args: messageTaskEventSchema,
	handler: async (ctx, event) => {
		//
		console.debug('add event', event);
		return await ctx.db.insert('taskEvents', event);
	},
});
