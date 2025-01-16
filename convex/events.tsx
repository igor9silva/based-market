import { generateId } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api.js';
import { Id } from './_generated/dataModel.js';
import { ActionCtx } from './_generated/server.js';
import { internalMutation, internalQuery, mutation, query } from './lib.js';
import { _requestRunTool, _requestThink } from './operations.js';
import { authorSchema } from './schemas/authorSchema.js';
import { ensureTaskOwner } from './tasks.js';

// Exposed -------------------------------------

export const findAll = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskOwner(ctx, { taskId });
		return await _findAll(ctx, { taskId });
	},
});

export const findOne = query({
	args: {
		eventId: zid('events'),
	},
	handler: async (ctx, { eventId }) => {
		//
		const event = await _findOne(ctx, { eventId });
		await ensureTaskOwner(ctx, { taskId: event.taskId });
		return event;
	},
});

// TODO: move to actions
export const sendMessage = mutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
	},
	handler: async (ctx, { taskId, message }) => {
		//
		console.debug(`send message '${message}' to taskId '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		return await _sendMessage(ctx, { taskId, message, author: currentUser._id });
	},
});

export const callTool = mutation({
	args: {
		taskId: zid('tasks'),
		toolName: z.string(),
		toolCallId: z.string().optional(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, toolName, toolCallId, args }) => {
		//
		console.debug(`call tool for taskId '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		return await _callTool(ctx, {
			taskId,
			author: currentUser._id,
			toolName,
			toolCallId,
			args,
		});
	},
});

// Internal (no authorization)------------------------------------

export const _findAll = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await ctx.db
			.query('events')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

export const _findOne = internalQuery({
	args: {
		eventId: zid('events'),
	},
	handler: async (ctx, { eventId }) => {
		//
		const event = await ctx.db.get(eventId);
		if (!event) throw new Error('Event not found');

		return event;
	},
});

export const _sendMessage = internalMutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, message, author }) => {
		//
		const eventId = await ctx.db.insert('events', {
			taskId,
			author,
			kind: 'message',
			message,
		});

		await _requestThink(ctx, { eventId, taskId, author });

		return eventId;
	},
});

export const _callTool = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		toolName: z.string(),
		toolCallId: z.string().optional(),
		args: z.record(z.any()),
		statusText: z.string().optional(),
	},
	handler: async (ctx, { taskId, author, toolName, toolCallId, args, statusText }) => {
		//
		const eventId = await ctx.db.insert('events', {
			taskId,
			author,
			kind: 'tool-call',
			toolName,
			toolCallId: toolCallId ?? generateId(),
			args,
			statusText,
		});

		await _requestRunTool(ctx, { origin: eventId, taskId, author, toolName, args });

		return eventId;
	},
});

export const _setToolCallStatusText = internalMutation({
	args: {
		eventId: zid('events'),
		text: z.string(),
	},
	handler: async (ctx, { eventId, text }) => {
		await ctx.db.patch(eventId, { statusText: text });
	},
});

export const _setToolCallResult = internalMutation({
	args: {
		eventId: zid('events'),
		result: z.string(),
		isError: z.boolean().default(false),
	},
	handler: async (ctx, { eventId, result, isError }) => {
		// TODO: add operation events (so we persist all the history)

		const event = await ctx.db.get(eventId);
		if (!event) throw new Error('Event not found');
		if (event.kind !== 'tool-call') throw new Error('Event is not a tool call');
		if (event.result) throw new Error('Tool call result already set');

		await ctx.db.patch(eventId, { result, isError });
		await _requestThink(ctx, { eventId, taskId: event.taskId, author: event.author });
	},
});

// Helper functions ------------------------------------

export function _sendMeseeksMessage(
	ctx: ActionCtx,
	args: {
		taskId: Id<'tasks'>;
		operationId: Id<'operations'>;
		message: string;
		isDone?: boolean;
	},
) {
	return ctx.runMutation(internal.events._sendMessage, {
		taskId: args.taskId,
		message: args.message,
		author: args.operationId,
	});
}

export function _addMeseeksToolCall(
	ctx: ActionCtx,
	args: {
		taskId: Id<'tasks'>;
		author: z.infer<typeof authorSchema>;
		toolName: string;
		toolCallId: string;
		args: Record<string, any>;
	},
) {
	return ctx.runMutation(internal.events._callTool, args);
}
