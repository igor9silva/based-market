import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { ensureTaskAuthor } from '../tasks/public';
import { _add, _findAll, _findAllRunning, _findOne } from './private';

export const act = mutation({
	args: {
		taskId: zid('tasks'),
		key: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, key, args }) => {
		//
		console.debug(`use tool on task '${taskId}'`);

		const { currentUser } = await ensureTaskAuthor(ctx, { taskId });

		return await _add(ctx, {
			key,
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
