import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel.js';
import { ActionCtx, MutationCtx, QueryCtx } from './_generated/server.js';
import { internalMutation, internalQuery, mutation, query } from './lib';
import { taskActionKindSchema, taskActionStatusSchema } from './schema';
import { _addActionRequestEvent } from './taskEvents';
import { ensureTaskOwner } from './tasks';

// Exposed -------------------------------------

export const findAll = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskOwner(ctx, { taskId });

		return await ctx.db
			.query('taskActions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

export const findOne = query({
	args: {
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		return action;
	},
});

export const request = mutation({
	args: {
		taskId: zid('tasks'),
		kind: taskActionKindSchema,
	},
	handler: async (ctx, { taskId, kind }) => {
		//
		console.debug(`[START] request action for taskId '${taskId}' of kind '${kind}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		const actionId = await _add(ctx, { taskId, kind }); // insert the new action as 'pending'
		await _addActionRequestEvent(ctx, { taskId, actionId, actionKind: kind, author: currentUser._id });
		await _scheduleNextActionIfNeeded(ctx, { taskId, userId: currentUser._id });

		console.debug(`[END] request action for taskId '${taskId}' of kind '${kind}'`);

		return actionId;
	},
});

export const skip = mutation({
	args: {
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		const { currentUser } = await ensureTaskOwner(ctx, { taskId: action.taskId });

		// skip is only allowed for pending or failed actions
		if (action.status !== 'pending' && action.status !== 'failed') {
			throw new Error(`Cannot skip ${action.status} actions`);
		}

		await _setStatus(ctx, { actionId, status: 'skipped' });
		// TODO: add event
		await _scheduleNextActionIfNeeded(ctx, { taskId: action.taskId, userId: currentUser._id });
	},
});

export const retry = mutation({
	args: {
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		const { currentUser } = await ensureTaskOwner(ctx, { taskId: action.taskId });

		// retry is only allowed for failed actions
		if (action.status !== 'failed') throw new Error(`Cannot retry ${action.status} actions`);

		await _scheduleAction(ctx, { taskId: action.taskId, actionId, userId: currentUser._id });
		// TODO: add event
	},
});

// Internal (no authorization)------------------------------------

export const _findOne = internalQuery({
	args: {
		actionId: zid('taskActions'),
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

export const _add = internalMutation({
	args: {
		taskId: zid('tasks'),
		kind: taskActionKindSchema,
	},
	handler: async (ctx, { taskId, kind }) => {
		return await ctx.db.insert('taskActions', {
			taskId,
			kind,
			status: 'pending',
			isDone: false,
		});
	},
});

export const _setStatus = internalMutation({
	args: {
		actionId: zid('taskActions'),
		status: taskActionStatusSchema,
		errorMessage: z.optional(z.string()),
	},
	handler: async (ctx, { actionId, status, errorMessage }) => {
		await ctx.db.patch(actionId, {
			status,
			isDone: status === 'succeeded' || status === 'failed' || status === 'skipped',
			errorMessage,
		});
	},
});

// Helper functions ------------------------------------

/**
 * Helper function to find task actions for a given task and status.
 * This is purely for ergonomics to avoid repeating the query logic.
 *
 * @param ctx The query context
 * @param args.taskId The ID of the task to find actions for
 * @param args.status The status to filter the actions by
 * @returns A query builder for task actions filtered by task and status
 */
function _findByStatus(
	ctx: QueryCtx,
	{
		taskId,
		status,
	}: {
		taskId: Id<'tasks'>;
		status: z.infer<typeof taskActionStatusSchema>;
	},
) {
	return ctx.db
		.query('taskActions')
		.withIndex('by_task', (q) => q.eq('taskId', taskId))
		.filter((q) => q.eq(q.field('status'), status))
		.order('asc');
}

export async function _setActionStatus(
	ctx: ActionCtx,
	args: {
		actionId: Id<'taskActions'>;
		status: z.infer<typeof taskActionStatusSchema>;
		errorMessage?: string;
	},
) {
	return await ctx.runMutation(internal.taskActions._setStatus, args);
}

async function _scheduleAction(
	ctx: ActionCtx | MutationCtx,
	args: {
		userId: Id<'users'>;
		taskId: Id<'tasks'>;
		actionId: Id<'taskActions'>;
	},
) {
	return ctx.scheduler.runAfter(0, internal.magic._run, args);
}

export async function _scheduleNextActionIfNeeded(
	ctx: ActionCtx | MutationCtx,
	{
		taskId,
		userId,
	}: {
		taskId: Id<'tasks'>;
		userId: Id<'users'>;
	},
) {
	const busyMessage = (amount: number, taskId: Id<'tasks'>) =>
		`Skipping scheduling next action for task ${taskId} because there are ${amount} running actions.`;

	const noPendingActionMessage = (taskId: Id<'tasks'>) =>
		`Skipping scheduling next action for task ${taskId} because there are no more pending actions.`;

	const failedMessage = (amount: number, taskId: Id<'tasks'>) =>
		`Skipping scheduling next action for task ${taskId} because there is ${amount} failed action(s). Retry or skip it first.`;

	// skip if there are running actions
	const runningActions = await ctx.runQuery(internal.taskActions._findAllRunning, { taskId });
	if (runningActions.length > 0) return console.info(busyMessage(runningActions.length, taskId));

	// skip if there are failed actions
	const failedActions = await ctx.runQuery(internal.taskActions._findAllFailed, { taskId });
	if (failedActions.length > 0) return console.info(failedMessage(failedActions.length, taskId));

	// skip if there are no pending actions
	const nextAction = await ctx.runQuery(internal.taskActions._findNext, { taskId });
	if (!nextAction) return console.info(noPendingActionMessage(taskId));

	// schedule next action
	return await _scheduleAction(ctx, { taskId, actionId: nextAction._id, userId });
}
