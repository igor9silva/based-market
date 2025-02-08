import { CoreTool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { QueryCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';
import { actionSchema } from '../schemas/actionSchema';
import { authorSchema } from '../schemas/authorSchema';
import { paginationOptionsSchema } from '../schemas/paginationOptionsSchema';
import { _syncTools } from '../tools/private';
import { _react, _runNextActionIfNeeded } from './lifecycle/private';

export const _add = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		owner: zid('users'),
		toolKey: z.string().describe('The key of the tool to use'),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, author, owner, toolKey, args }) => {
		//
		console.debug(`${author} acts: ${toolKey}`);

		const syncTools = await _syncTools(ctx, taskId, author, owner);
		const result = await _executeToolIfSync(syncTools, toolKey, args); //

		const action = actionSchema.parse({
			taskId,
			author,
			owner,
			kind: result ? 'sync' : 'async',
			status: result ? 'succeeded' : 'enqueued',
			toolKey,
			result: result ?? null,
			costs: result ? [{ symbol: 'WLD', amount: 0.01, description: 'Action' }] : [], // TODO: standardize costs
			args,
		});

		const actionId = await ctx.db.insert('actions', action);

		if (action.status === 'enqueued') await _runNextActionIfNeeded(ctx, { taskId, author });
		if (action.result) await _react(ctx, { taskId, author: actionId });

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

export const _findAllPaginated = internalQuery({
	args: {
		taskId: zid('tasks'),
		paginationOpts: paginationOptionsSchema,
	},
	handler: async (ctx, { taskId, paginationOpts }) => {
		//
		return await ctx.db
			.query('actions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.order('desc')
			.paginate(paginationOpts);
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

function _executeToolIfSync(
	syncTools: Record<string, CoreTool>,
	toolKey: string,
	args: Record<string, any>,
): Promise<string | null> {
	//
	if (!(toolKey in syncTools)) return Promise.resolve(null);

	const tool = syncTools[toolKey as keyof typeof syncTools];

	// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool
	return tool.execute(args);
}
