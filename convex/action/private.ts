import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { QueryCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';
import { actionSchema } from '../schemas/actionSchema';
import { authorSchema } from '../schemas/authorSchema';
import { paginationOptionsSchema } from '../schemas/paginationOptionsSchema';
import { _findOne as _findOneTask } from '../tasks/private';
import { _runNextActionIfNeeded } from './lifecycle/private';

export const _add = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
		owner: zid('users'),
		skillKey: z.string().describe('The key of the skill to use'),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, author, owner, skillKey, args }) => {
		//
		console.debug(`${author} acts: ${skillKey}`);

		const task = await _findOneTask(ctx, { taskId });

		// if task is already done, prepend with a reopen action
		// TODO: this should only happen for user actions. Should we check here?
		// We're not checking here but meseeks should not be able to _add() actions if task is done
		if (task.isDone) {
			await ctx.db.insert('actions', {
				taskId,
				author,
				owner,
				status: 'enqueued',
				result: null,
				skillKey: 'reopen',
				args: {},
			});
		}

		const actionId = await ctx.db.insert('actions', {
			taskId,
			author,
			owner,
			status: 'enqueued',
			result: null,
			skillKey,
			args,
		});

		await _runNextActionIfNeeded(ctx, taskId);

		return actionId;
	},
});

export const _authorize = internalMutation({
	args: {
		taskId: zid('tasks'),
		actionId: zid('actions'),
		approver: z.union([
			zid('users'), //
			z.literal('auto'),
		]),
		approved: z.boolean(),
	},
	handler: async (ctx, { taskId, actionId, approver, approved }) => {
		//
		const action = await _findOne(ctx, { actionId });
		if (action.approvedAt) return;

		// if already running, keep running - else enqueue
		const approvedStatus = action.status === 'running' ? ('running' as const) : ('enqueued' as const);

		console.debug(`${approver} ${approved ? 'approved' : 'rejected'} ${action.skillKey} (${action._id})`);

		const patch = approved
			? {
					status: action.status === 'running' ? ('running' as const) : ('enqueued' as const),
					approvedBy: approver,
					approvedAt: Date.now(),
				}
			: {
					status: 'skipped' as const,
					result: 'rejected by ' + approver,
					costs: [],
				};

		await ctx.db.patch(actionId, patch);

		if (approved && approvedStatus === 'enqueued') {
			await _runNextActionIfNeeded(ctx, taskId);
		}
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

export const _findAllEnqueuedReactions = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		return await ctx.db
			.query('actions')
			.withIndex('by_task_status', (q) =>
				q
					.eq('taskId', taskId) //
					.eq('status', 'enqueued'),
			)
			.filter((q) => q.eq(q.field('skillKey'), 'react'))
			.collect();
	},
});

export const _findLastActions = internalQuery({
	args: {
		taskId: zid('tasks'),
		amount: z.number().min(1),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		return await ctx.db
			.query('actions')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.order('desc')
			.take(amount);
	},
});

export const _skipAllEnqueuedReactions = internalMutation({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const enqueuedReactions = await _findAllEnqueuedReactions(ctx, { taskId });

		return await Promise.all(
			enqueuedReactions.map((action) =>
				ctx.db.patch(action._id, {
					status: 'skipped',
					result: 'outdated — new actions happened before this action could run',
					costs: [],
				}),
			),
		);
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
