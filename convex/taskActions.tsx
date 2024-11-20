import { Infer, v } from 'convex/values';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel.js';
import {
	ActionCtx,
	internalMutation,
	internalQuery,
	mutation,
	MutationCtx,
	query,
	QueryCtx,
} from './_generated/server.js';
import { taskActionKinds, taskActionStatuses } from './schema';
import { addActionRequest } from './taskEvents';
import { ensureTaskOwner } from './tasks';

// Exposed -------------------------------------

export const findAll = query({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		await ensureTaskOwner(ctx, { taskId });
		return await ctx.db
			.query('taskActions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

export const findOne = query({
	args: {
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		return action;
	},
});

export const enqueue = mutation({
	args: {
		taskId: v.id('tasks'),
		kind: taskActionKinds,
	},
	handler: async (ctx, { taskId, kind }) => {
		//
		console.debug(`[START] enqueue action for taskId '${taskId}' of kind '${kind}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		// insert the new action as 'pending'
		const actionId = await ctx.db.insert('taskActions', {
			taskId,
			kind,
			status: 'pending',
			isDone: false,
		});

		await addActionRequest(ctx, {
			taskId,
			kind: 'actionRequest',
			author: currentUser._id,
			actionKind: kind,
		});

		await scheduleNextActionIfNeeded(ctx, { taskId, userId: currentUser._id });

		console.debug(`[END] enqueue action for taskId '${taskId}' of kind '${kind}'`);

		return actionId;
	},
});

export const skip = mutation({
	args: {
		actionId: v.id('taskActions'),
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

		await setStatus(ctx, { actionId, status: 'skipped' });
		await scheduleNextActionIfNeeded(ctx, { taskId: action.taskId, userId: currentUser._id });
	},
});

export const retry = mutation({
	args: {
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		const { currentUser } = await ensureTaskOwner(ctx, { taskId: action.taskId });

		// retry is only allowed for failed actions
		if (action.status !== 'failed') throw new Error(`Cannot retry ${action.status} actions`);

		await scheduleAction(ctx, { taskId: action.taskId, actionId, userId: currentUser._id });
	},
});

// Internal (no authorization)------------------------------------

export const _findOne = internalQuery({
	args: {
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		return action;
	},
});

export const findAllRunning = internalQuery({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await findByStatus(ctx, { taskId, status: 'running' }).collect();
	},
});

export const findAllFailed = internalQuery({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await findByStatus(ctx, { taskId, status: 'failed' }).collect();
	},
});

export const findNext = internalQuery({
	args: {
		taskId: v.id('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await findByStatus(ctx, { taskId, status: 'pending' }).first();
	},
});

export const setStatus = internalMutation({
	args: {
		actionId: v.id('taskActions'),
		status: taskActionStatuses,
		errorMessage: v.optional(v.string()),
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
function findByStatus(
	ctx: QueryCtx,
	{
		taskId,
		status,
	}: {
		taskId: Id<'tasks'>;
		status: Infer<typeof taskActionStatuses>;
	},
) {
	return ctx.db
		.query('taskActions')
		.withIndex('by_task', (q) => q.eq('taskId', taskId))
		.filter((q) => q.eq(q.field('status'), status))
		.order('asc');
}

export async function setActionStatus(
	ctx: ActionCtx,
	args: {
		actionId: Id<'taskActions'>;
		status: Infer<typeof taskActionStatuses>;
		errorMessage?: string;
	},
) {
	return await ctx.runMutation(internal.taskActions.setStatus, args);
}

async function scheduleAction(
	ctx: ActionCtx | MutationCtx,
	args: {
		userId: Id<'users'>;
		taskId: Id<'tasks'>;
		actionId: Id<'taskActions'>;
	},
) {
	return ctx.scheduler.runAfter(0, internal.magic.run, args);
}

export async function scheduleNextActionIfNeeded(
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
	const runningActions = await ctx.runQuery(internal.taskActions.findAllRunning, { taskId });
	if (runningActions.length > 0) return console.info(busyMessage(runningActions.length, taskId));

	// skip if there are failed actions
	const failedActions = await ctx.runQuery(internal.taskActions.findAllFailed, { taskId });
	if (failedActions.length > 0) return console.info(failedMessage(failedActions.length, taskId));

	// skip if there are no pending actions
	const nextAction = await ctx.runQuery(internal.taskActions.findNext, { taskId });
	if (!nextAction) return console.info(noPendingActionMessage(taskId));

	// schedule next action
	return await scheduleAction(ctx, { taskId, actionId: nextAction._id, userId });
}
