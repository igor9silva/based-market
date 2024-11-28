import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel.js';
import { ActionCtx, MutationCtx, QueryCtx } from './_generated/server.js';
import { internalMutation, internalQuery, mutation, query } from './lib';
import { authorSchema } from './schemas/author';
import { taskActionStatusSchema } from './schemas/taskAction';
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
		const action = await _findOne(ctx, { actionId });

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		return action;
	},
});

export const sendMessage = mutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
	},
	handler: async (ctx, { taskId, message }) => {
		//
		console.debug(`[START] send message to taskId '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		const actionId = await _sendMessage(ctx, { taskId, message, author: currentUser._id });
		await _scheduleNextActionIfNeeded(ctx, { taskId, userId: currentUser._id });

		console.debug(`[END] send message to taskId '${taskId}'`);

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

export const _sendMessage = internalMutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
		author: authorSchema,
		status: taskActionStatusSchema.default('pending'),
	},
	handler: async (ctx, { taskId, message, author, status }) => {
		//
		return await ctx.db.insert('taskActions', {
			taskId,
			author,
			kind: 'message',
			message,
			status,
			isDone: isStatusDone(status),
		});
	},
});

export const _reportMutation = internalMutation({
	args: {
		taskId: zid('tasks'),
		changes: z.string(),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, changes, author }) => {
		//
		const status = author === 'meseeks' ? 'succeeded' : 'pending';

		return await ctx.db.insert('taskActions', {
			taskId,
			author,
			kind: 'mutation',
			changes,
			status,
			isDone: isStatusDone(status),
		});
	},
});

export const _setStatus = internalMutation({
	args: {
		actionId: zid('taskActions'),
		status: taskActionStatusSchema,
	},
	handler: async (ctx, { actionId, status }) => {
		await ctx.db.patch(actionId, {
			status,
			isDone: isStatusDone(status),
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
function isStatusDone(status: z.infer<typeof taskActionStatusSchema>) {
	return status === 'succeeded' || status === 'failed' || status === 'skipped';
}

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
	ctx: ActionCtx | MutationCtx,
	args: {
		actionId: Id<'taskActions'>;
		status: z.infer<typeof taskActionStatusSchema>;
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
	// ideally `running` would be set in the action itself, but that'd lead into a race condition
	await _setActionStatus(ctx, { status: 'running', actionId: args.actionId });

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

	// grab next pending action, skip if there are none
	const nextAction = await ctx.runQuery(internal.taskActions._findNext, { taskId });
	if (!nextAction) return console.info(noPendingActionMessage(taskId));

	// schedule next action
	return await _scheduleAction(ctx, { taskId, actionId: nextAction._id, userId });
}

export function _sendMeseeksMessage(
	ctx: ActionCtx,
	args: {
		taskId: Id<'tasks'>;
		message: string;
	},
) {
	return ctx.runMutation(internal.taskActions._sendMessage, {
		taskId: args.taskId,
		message: args.message,
		author: 'meseeks',
		status: 'succeeded',
	});
}
