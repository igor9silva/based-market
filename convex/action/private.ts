import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { QueryCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';
import { actionSchema } from '../schemas/actionSchema';
import { authorSchema } from '../schemas/authorSchema';
import { _addResolved, _enqueue } from './lifecycle/private';

export const _say = internalMutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
		author: authorSchema,
		status: z.enum(['succeeded', 'failed']).optional().default('succeeded'),
	},
	handler: async (ctx, { taskId, message, author }) => {
		//
		console.debug(`${author} says: ${message}`);

		return await _addResolved(ctx, {
			action: {
				taskId,
				author,
				kind: 'sync',
				status: 'succeeded',
				key: 'say',
				result: message,
				args: {},
			},
		});
	},
});

export const _act = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		key: z.string().describe('The key of the tool to use'),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, author, key, args }) => {
		//
		console.debug(`${author} acts: ${key}`);

		return await _enqueue(ctx, {
			action: {
				taskId,
				author,
				kind: 'async',
				status: 'enqueued',
				key,
				args,
			},
		});
	},
});

// ------------------------------------

export const _findAll = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
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

function _findByStatus(
	ctx: QueryCtx,
	{
		taskId,
		status,
	}: {
		taskId: Id<'tasks'>;
		status: z.infer<typeof actionSchema>['status'];
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

export const _findRunning = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await _findByStatus(ctx, { taskId, status: 'running' }).first();
	},
});

export const _findNext = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await _findByStatus(ctx, { taskId, status: 'enqueued' }).first();
	},
});
