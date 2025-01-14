import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api.js';
import { Id } from './_generated/dataModel.js';
import { ActionCtx, MutationCtx, QueryCtx } from './_generated/server.js';
import { internalMutation, internalQuery, mutation, query } from './lib';
import { authorSchema } from './schemas/authorSchema';
import { operationKindSchema, operationStatusSchema } from './schemas/operationSchema';
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
		operationId: zid('operations'),
	},
	handler: async (ctx, { operationId }) => {
		//
		const operation = await _findOne(ctx, { operationId });

		await ensureTaskOwner(ctx, { taskId: operation.taskId });

		return operation;
	},
});

export const skip = mutation({
	args: {
		operationId: zid('operations'),
	},
	handler: async (ctx, { operationId }) => {
		//
		const operation = await ctx.db.get(operationId);
		if (!operation) throw new Error('Operation not found');

		const { currentUser } = await ensureTaskOwner(ctx, { taskId: operation.taskId });

		// skip is only allowed for pending or failed operations
		if (operation.status !== 'pending' && operation.status !== 'failed') {
			throw new Error(`Cannot skip ${operation.status} operations`);
		}

		await _setStatus(ctx, { operationId, status: 'skipped' });
		// TODO: add event
		await _runNextOperationIfNeeded(ctx, { taskId: operation.taskId, author: currentUser._id });
	},
});

export const retry = mutation({
	args: {
		operationId: zid('operations'),
	},
	handler: async (ctx, { operationId }) => {
		//
		const operation = await ctx.db.get(operationId);
		if (!operation) throw new Error('Operation not found');

		const { currentUser } = await ensureTaskOwner(ctx, { taskId: operation.taskId });

		// retry is only allowed for failed operations
		if (operation.status !== 'failed') throw new Error(`Cannot retry ${operation.status} operations`);

		await _runOperation(ctx, {
			taskId: operation.taskId,
			operationId,
			author: currentUser._id,
			operationKind: operation.kind,
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
			.query('operations')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

export const _findOne = internalQuery({
	args: {
		operationId: zid('operations'),
	},
	handler: async (ctx, { operationId }) => {
		//
		const operation = await ctx.db.get(operationId);
		if (!operation) throw new Error('Operation not found');

		return operation;
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
		eventId: zid('events'),
		taskId: zid('tasks'),
		author: authorSchema,
	},
	handler: async (ctx, { eventId, taskId, author }) => {
		//
		// skip if there is already a pending think operation
		const pendingThink = await _findByStatus(ctx, { taskId, status: 'pending' })
			.filter((q) => q.eq(q.field('kind'), 'think'))
			.first();

		if (pendingThink) {
			return console.debug(
				`Skipping scheduling think operation for task ${taskId} because there is already a pending think operation.`,
			);
		}

		const operationId = await ctx.db.insert('operations', {
			kind: 'think',
			origin: eventId,
			author,
			taskId,
			status: 'pending',
			isDone: false,
		});

		await _runNextOperationIfNeeded(ctx, { taskId, author });

		return operationId;
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
		const operationId = await ctx.db.insert('operations', {
			kind: 'run-tool',
			origin,
			author,
			taskId,
			toolName,
			args,
			status: 'pending',
			isDone: false,
		});

		await _runNextOperationIfNeeded(ctx, { taskId, author });

		return operationId;
	},
});

export const _setStatus = internalMutation({
	args: {
		operationId: zid('operations'),
		status: operationStatusSchema,
	},
	handler: async (ctx, { operationId, status }) => {
		await ctx.db.patch(operationId, {
			status,
			isDone: isStatusDone(status),
		});
	},
});

// Helper functions ------------------------------------

/**
 * Helper function to find task operations for a given task and status.
 * This is purely for ergonomics to avoid repeating the query logic.
 *
 * @param ctx The query context
 * @param args.taskId The ID of the task to find operations for
 * @param args.status The status to filter the operations by
 * @returns A query builder for task operations filtered by task and status
 */
function isStatusDone(status: z.infer<typeof operationStatusSchema>) {
	return status === 'succeeded' || status === 'failed' || status === 'skipped';
}

function _findByStatus(
	ctx: QueryCtx,
	{
		taskId,
		status,
	}: {
		taskId: Id<'tasks'>;
		status: z.infer<typeof operationStatusSchema>;
	},
) {
	return ctx.db
		.query('operations')
		.withIndex('by_task_status', (q) =>
			q
				.eq('taskId', taskId) //
				.eq('status', status),
		)
		.order('asc');
}

export async function _setOperationStatus(
	ctx: ActionCtx | MutationCtx,
	args: {
		operationId: Id<'operations'>;
		status: z.infer<typeof operationStatusSchema>;
	},
) {
	return await ctx.runMutation(internal.operations._setStatus, args);
}

async function _runOperation(
	ctx: ActionCtx | MutationCtx,
	args: {
		author: z.infer<typeof authorSchema>;
		taskId: Id<'tasks'>;
		operationId: Id<'operations'>;
		operationKind: z.infer<typeof operationKindSchema>;
	},
) {
	// ideally `running` would be set in the operation itself, but that'd lead into a race condition
	await _setOperationStatus(ctx, { status: 'running', operationId: args.operationId });

	const params = {
		taskId: args.taskId,
		operationId: args.operationId,
		author: args.author,
	};

	switch (args.operationKind) {
		case 'think':
			return ctx.scheduler.runAfter(0, internal.magicRock._think, params);
		case 'run-tool':
			return ctx.scheduler.runAfter(0, internal.tools.index._run, params);
	}
}

export async function _runNextOperationIfNeeded(
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
		`Skipping scheduling next operation for task ${taskId} because there are ${amount} running operations.`;

	const noPendingOperationMessage = (taskId: Id<'tasks'>) =>
		`Skipping scheduling next operation for task ${taskId} because there are no more pending operations.`;

	const failedMessage = (amount: number, taskId: Id<'tasks'>) =>
		`Skipping scheduling next operation for task ${taskId} because there is ${amount} failed operation(s). Retry or skip it first.`;

	// skip if there are running operations
	const runningOperations = await ctx.runQuery(internal.operations._findAllRunning, { taskId });
	if (runningOperations.length > 0) return console.info(busyMessage(runningOperations.length, taskId));

	// skip if there are failed operations
	const failedOperations = await ctx.runQuery(internal.operations._findAllFailed, { taskId });
	if (failedOperations.length > 0) return console.info(failedMessage(failedOperations.length, taskId));

	// grab next pending operation, skip if there are none
	const nextOperation = await ctx.runQuery(internal.operations._findNext, { taskId });
	if (!nextOperation) return console.info(noPendingOperationMessage(taskId));

	// schedule next operation
	return await _runOperation(ctx, {
		taskId,
		operationId: nextOperation._id,
		author,
		operationKind: nextOperation.kind,
	});
}
