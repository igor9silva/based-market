import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { QueryCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';
import { actionSchema } from '../schemas/actionSchema';
import { authorSchema } from '../schemas/authorSchema';
import { _react, _runNextActionIfNeeded } from './lifecycle/private';

export const _add = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		key: z.string().describe('The key of the tool to use'),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, author, key, args }) => {
		//
		console.debug(`${author} acts: ${key}`);

		// TODO: instead we should run all `sync` tools immediately
		const result = key === 'say' ? (args.message as string) : null;

		const action = actionSchema.parse({
			taskId,
			author,
			kind: result ? 'sync' : 'async',
			status: result ? 'succeeded' : 'enqueued',
			key,
			result: result ?? null,
			args,
		});

		const actionId = await ctx.db.insert('actions', action);

		const id = { taskId: action.taskId, author: action.author };

		if (action.status === 'enqueued') await _runNextActionIfNeeded(ctx, id);
		if (action.result) await _react(ctx, id);

		return actionId;
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

export const _findAllRunning = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		return await _findByStatus(ctx, { taskId, status: 'running' }).collect();
	},
});

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
