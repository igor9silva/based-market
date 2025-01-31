import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { paginationOptionsSchema } from '../schemas/paginationOptionsSchema';
import { ensureTaskAuthor } from '../tasks/public';
import { _add, _findAll, _findAllPaginated, _findAllRunning, _findOne } from './private';

export const act = mutation({
	args: {
		taskId: zid('tasks'),
		toolKey: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, toolKey, args }) => {
		//
		console.debug(`use tool on task '${taskId}'`);

		const { currentUser } = await ensureTaskAuthor(ctx, { taskId });

		return await _add(ctx, {
			toolKey,
			args,
			taskId,
			author: currentUser._id,
		});
	},
});

export const findAll = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskAuthor(ctx, { taskId });

		return await _findAll(ctx, { taskId });
	},
});

export const findAllPaginated = query({
	args: {
		taskId: zid('tasks'),
		paginationOpts: paginationOptionsSchema,
	},
	handler: async (ctx, { taskId, paginationOpts }) => {
		//
		await ensureTaskAuthor(ctx, { taskId });

		return await _findAllPaginated(ctx, { taskId, paginationOpts });
	},
});

export const findAllRunning = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskAuthor(ctx, { taskId });

		return await _findAllRunning(ctx, { taskId });
	},
});

export const findOne = query({
	args: {
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await _findOne(ctx, { actionId });

		await ensureTaskAuthor(ctx, { taskId: action.taskId });

		return action;
	},
});
