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

		// find all running actions
		const runningActions = await findAllRunning(ctx, { taskId });

		// insert the new action as 'running' or 'pending'
		const actionId = await ctx.db.insert('taskActions', {
			taskId,
			kind,
			status: runningActions.length > 0 ? 'pending' : 'running', // important to avoid race condition
			isDone: false,
		});

		// if no running actions, run next pending action immediately
		if (runningActions.length === 0) {
			await scheduleAction(ctx, { taskId, actionId, userId: currentUser._id });
		}

		console.debug(`[END] enqueue action for taskId '${taskId}' of kind '${kind}'`);

		return actionId;
	},
});

export const cancel = mutation({
	args: {
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		if (action.status !== 'pending') throw new Error(`Cannot cancel ${action.status} actions`);

		await setStatus(ctx, { actionId, status: 'cancelled' });
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
	},
	handler: async (ctx, { actionId, status }) => {
		await ctx.db.patch(actionId, {
			status,
			isDone: status === 'succeeded' || status === 'failed' || status === 'cancelled',
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
	ctx: ActionCtx,
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

	// skip if there are running actions
	const runningActions = await ctx.runQuery(internal.taskActions.findAllRunning, { taskId });
	if (runningActions.length > 0) return console.info(busyMessage(runningActions.length, taskId));

	// skip if there are no pending actions
	const nextAction = await ctx.runQuery(internal.taskActions.findNext, { taskId });
	if (!nextAction) return console.info(noPendingActionMessage(taskId));

	// schedule next action
	return await scheduleAction(ctx, { taskId, actionId: nextAction._id, userId });
}
