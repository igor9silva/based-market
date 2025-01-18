import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { ensureTaskOwner } from '../tasks/public';
import { _act, _findAll, _findOne, _say } from './private';

export const say = mutation({
	args: {
		taskId: zid('tasks'),
		message: z.string(),
	},
	handler: async (ctx, { taskId, message }) => {
		//
		console.debug(`say '${message}' on task '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		return await _say(ctx, {
			message,
			taskId,
			author: currentUser._id,
		});
	},
});

export const act = mutation({
	args: {
		taskId: zid('tasks'),
		key: z.string(),
		args: z.record(z.any()),
	},
	handler: async (ctx, { taskId, key, args }) => {
		//
		console.debug(`use tool on task '${taskId}'`);

		const { currentUser } = await ensureTaskOwner(ctx, { taskId });

		return await _act(ctx, {
			key,
			args,
			taskId,
			author: currentUser._id,
		});
	},
});

// ------------------------------------

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
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		const action = await _findOne(ctx, { actionId });

		await ensureTaskOwner(ctx, { taskId: action.taskId });

		return action;
	},
});
