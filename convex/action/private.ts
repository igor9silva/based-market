import { CoreTool } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { QueryCtx } from '../_generated/server';
import { internalMutation, internalQuery } from '../lib';
import { actionSchema } from '../schemas/actionSchema';
import { authorSchema } from '../schemas/authorSchema';
import { paginationOptionsSchema } from '../schemas/paginationOptionsSchema';
import { _syncSkills } from '../skills/private';
import { INSUFFICIENT_ACCOUNT_FUNDS_ERROR, isError } from '../utils/errors';
import { _react, _runNextActionIfNeeded } from './lifecycle/private';

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

		const syncSkills = await _syncSkills(ctx, taskId, author, owner);
		const result = await _executeSkillIfSync(syncSkills, skillKey, args); //

		const action = actionSchema.parse({
			taskId,
			author,
			owner,
			kind: result ? 'sync' : 'async',
			status: result ? 'succeeded' : 'enqueued',
			skillKey,
			result: result ?? null,
			costs: result ? [{ symbol: 'USD', amount: 0.01, description: 'Action' }] : [], // TODO: standardize costs
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

async function _executeSkillIfSync(
	syncSkills: Record<string, CoreTool>,
	skillKey: string,
	args: Record<string, any>,
): Promise<string | null> {
	//
	if (!(skillKey in syncSkills)) return Promise.resolve(null);

	const skill = syncSkills[skillKey as keyof typeof syncSkills];

	try {
		// @ts-expect-error we intentionally do not support exposing skillCallId or message history to the skill
		return await skill.execute(args);
	} catch (error) {
		console.debug('executeSkillIfSync', error);
		if (isError(INSUFFICIENT_ACCOUNT_FUNDS_ERROR, error)) {
			return Promise.resolve(`Insufficient account funds. Please top up your account to continue. <TopUpCard />`);
		}
		throw error;
	}
}
