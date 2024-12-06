import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Id } from './_generated/dataModel.js';
import { ActionCtx, MutationCtx, QueryCtx } from './_generated/server.js';
import { internalMutation, internalQuery, mutation, query } from './lib';
import { authorSchema } from './schemas/authorSchema';
import { taskActionKindSchema, taskActionStatusSchema } from './schemas/taskActionSchema';
import { ensureTaskOwner } from './tasks';

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
		actionId: zid('taskActions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await _findOne(ctx, { actionId });

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		return action;
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
		await _runNextActionIfNeeded(ctx, { taskId: action.taskId, author: currentUser._id });
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

		await _runAction(ctx, {
			taskId: action.taskId,
			actionId,
			author: currentUser._id,
			actionKind: action.kind,
		});
		// TODO: add event
	},
});

// Internal (no authorization)------------------------------------

export const _findAll = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await ctx.db
			.query('taskActions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

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

export const _requestThink = internalMutation({
	args: {
		eventId: zid('taskEvents'),
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

		const actionId = await ctx.db.insert('taskActions', {
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
		origin: zid('taskEvents'),
		taskId: zid('tasks'),
		author: authorSchema,
		toolName: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { origin, taskId, author, toolName, args }) => {
		//
		const actionId = await ctx.db.insert('taskActions', {
			kind: 'run-tool',
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
		actionId: Id<'taskActions'>;
		status: z.infer<typeof taskActionStatusSchema>;
	},
) {
	return await ctx.runMutation(internal.taskActions._setStatus, args);
}

async function _runAction(
	ctx: ActionCtx | MutationCtx,
	args: {
		author: z.infer<typeof authorSchema>;
		taskId: Id<'tasks'>;
		actionId: Id<'taskActions'>;
		actionKind: z.infer<typeof taskActionKindSchema>;
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
		case 'run-tool':
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
	const runningActions = await ctx.runQuery(internal.taskActions._findAllRunning, { taskId });
	if (runningActions.length > 0) return console.info(busyMessage(runningActions.length, taskId));

	// skip if there are failed actions
	const failedActions = await ctx.runQuery(internal.taskActions._findAllFailed, { taskId });
	if (failedActions.length > 0) return console.info(failedMessage(failedActions.length, taskId));

	// grab next pending action, skip if there are none
	const nextAction = await ctx.runQuery(internal.taskActions._findNext, { taskId });
	if (!nextAction) return console.info(noPendingActionMessage(taskId));

	// schedule next action
	return await _runAction(ctx, {
		taskId,
		actionId: nextAction._id,
		author,
		actionKind: nextAction.kind,
	});
}
