import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';

export const _say = internalMutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, message, author }) => {
		//
		const actionId = await ctx.db.insert('actions', {
			taskId,
			author,
			kind: 'mutation',
			status: 'succeeded',
			key: 'say',
			result: message,
			args: {},
		});

		//
		// const actionId = await ctx.db.insert('actions', {
		// 	taskId,
		// 	author,
		// 	kind: 'mutation',
		// 	result: message,
		// 	key: 'sendMessage',
		// 	args: {},
		// });

		// await _requestThink(ctx, { actionId, taskId, author });

		return actionId;
	},
});

export const _useTool = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		key: z.string().describe('The key of the tool to use'),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, author, key, args }) => {
		//
		const actionId = await ctx.db.insert('actions', {
			taskId,
			author,
			kind: 'tool',
			status: 'enqueued',
			key,
			args,
		});

		// await _requestRunTool(ctx, { origin: actionId, taskId, author, toolName, args });

		return actionId;
	},
});

export const _decide = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		key: z.string().describe('The key of the tool to use'),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, author, key, args }) => {
		//
		const actionId = await ctx.db.insert('actions', {
			taskId,
			author,
			kind: 'decision',
			status: 'enqueued',
			key,
			args,
		});

		return actionId;
	},
});

// ------------------------------------

export const _findAll = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await ctx.db
			.query('actions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

export const _findOne = internalQuery({
	args: {
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		return action;
	},
});

export const _findAllRunning = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await _findByStatus(ctx, { taskId, status: 'running' }).collect();
	},
});

export const _findAllFailed = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await _findByStatus(ctx, { taskId, status: 'failed' }).collect();
	},
});

export const _findNext = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await _findByStatus(ctx, { taskId, status: 'pending' }).first();
	},
});

// ------------------------------------

// export const _setToolCallStatusText = internalMutation({
// 	args: {
// 		actionId: zid('actions'),
// 		text: z.string(),
// 	},
// 	handler: async (ctx, { actionId, text }) => {
// 		await ctx.db.patch(actionId, { statusText: text });
// 	},
// });

export const _setToolCallResult = internalMutation({
	args: {
		actionId: zid('actions'),
		result: z.string(),
		isError: z.boolean().default(false),
	},
	handler: async (ctx, { actionId, result, isError }) => {
		// TODO: add action events (so we persist all the history)

		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');
		if (action.kind !== 'tool-call') throw new Error('Action is not a tool call');
		if (action.result) throw new Error('Tool call result already set');

		await ctx.db.patch(actionId, { result, isError });
		await _requestThink(ctx, { actionId, taskId: action.taskId, author: action.author });
	},
});

export function _sendMeseeksMessage(
	ctx: ActionCtx,
	args: {
		taskId: Id<'tasks'>;
		actionId: Id<'actions'>;
		message: string;
		isDone?: boolean;
	},
) {
	return ctx.runMutation(internal.actions._sendMessage, {
		taskId: args.taskId,
		message: args.message,
		author: args.actionId,
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
	return ctx.runMutation(internal.actions._useTool, args);
}

export const _requestThink = internalMutation({
	args: {
		eventId: zid('events'),
		taskId: zid('tasks'),
		author: authorSchema,
	},
	handler: async (ctx, { eventId, taskId, author }) => {
		//
		// skip if there is already a pending think action
		const pendingThink = await _findByStatus(ctx, { taskId, status: 'pending' })
			.filter((q) => q.eq(q.field('kind'), 'think'))
			.first();

		if (pendingThink) {
			return console.debug(
				`Skipping scheduling think action for task ${taskId} because there is already a pending think action.`,
			);
		}

		const actionId = await ctx.db.insert('actions', {
			kind: 'think',
			origin: eventId,
			author,
			taskId,
			status: 'pending',
			isDone: false,
		});

		await _runNextActionIfNeeded(ctx, { taskId, author });

		return actionId;
	},
});

export const _requestRunTool = internalMutation({
	args: {
		origin: zid('events'),
		taskId: zid('tasks'),
		author: authorSchema,
		toolName: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { origin, taskId, author, toolName, args }) => {
		//
		const actionId = await ctx.db.insert('actions', {
			kind: 'tool',
			origin,
			author,
			taskId,
			toolName,
			args,
			status: 'pending',
			isDone: false,
		});

		await _runNextActionIfNeeded(ctx, { taskId, author });

		return actionId;
	},
});

export const _setStatus = internalMutation({
	args: {
		actionId: zid('actions'),
		status: actionStatusSchema,
	},
	handler: async (ctx, { actionId, status }) => {
		await ctx.db.patch(actionId, {
			status,
			isDone: isStatusDone(status),
		});
	},
});

// Helper functions ------------------------------------

function _findByStatus(
	ctx: QueryCtx,
	{
		taskId,
		status,
	}: {
		taskId: Id<'tasks'>;
		status: z.infer<typeof actionStatusSchema>;
	},
) {
	return ctx.db
		.query('actions')
		.withIndex('by_task_status', (q) =>
			q
				.eq('taskId', taskId) //
				.eq('status', status),
		)
		.order('asc');
}

export async function _setActionStatus(
	ctx: ActionCtx | MutationCtx,
	args: {
		actionId: Id<'actions'>;
		status: z.infer<typeof actionStatusSchema>;
	},
) {
	return await ctx.runMutation(internal.actions._setStatus, args);
}

async function _runAction(
	ctx: ActionCtx | MutationCtx,
	args: {
		author: z.infer<typeof authorSchema>;
		taskId: Id<'tasks'>;
		actionId: Id<'actions'>;
		actionKind: z.infer<typeof actionKindSchema>;
	},
) {
	// ideally `running` would be set in the action itself, but that'd lead into a race condition
	await _setActionStatus(ctx, { status: 'running', actionId: args.actionId });

	const params = {
		taskId: args.taskId,
		actionId: args.actionId,
		author: args.author,
	};

	switch (args.actionKind) {
		case 'think':
			return ctx.scheduler.runAfter(0, internal.magicRock._think, params);
		case 'tool':
			return ctx.scheduler.runAfter(0, internal.tools.index._run, params);
	}
}

export async function _runNextActionIfNeeded(
	ctx: ActionCtx | MutationCtx,
	{
		taskId,
		author,
	}: {
		taskId: Id<'tasks'>;
		author: z.infer<typeof authorSchema>;
	},
) {
	const busyMessage = (amount: number, taskId: Id<'tasks'>) =>
		`Skipping scheduling next action for task ${taskId} because there are ${amount} running actions.`;

	const noPendingActionMessage = (taskId: Id<'tasks'>) =>
		`Skipping scheduling next action for task ${taskId} because there are no more pending actions.`;

	const failedMessage = (amount: number, taskId: Id<'tasks'>) =>
		`Skipping scheduling next action for task ${taskId} because there is ${amount} failed action(s). Retry or skip it first.`;

	// skip if there are running actions
	const runningActions = await ctx.runQuery(internal.actions._findAllRunning, { taskId });
	if (runningActions.length > 0) return console.info(busyMessage(runningActions.length, taskId));

	// skip if there are failed actions
	const failedActions = await ctx.runQuery(internal.actions._findAllFailed, { taskId });
	if (failedActions.length > 0) return console.info(failedMessage(failedActions.length, taskId));

	// grab next pending action, skip if there are none
	const nextAction = await ctx.runQuery(internal.actions._findNext, { taskId });
	if (!nextAction) return console.info(noPendingActionMessage(taskId));

	// schedule next action
	return await _runAction(ctx, {
		taskId,
		actionId: nextAction._id,
		author,
		actionKind: nextAction.kind,
	});
}
