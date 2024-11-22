import { Infer, v } from 'convex/values';
import { internal } from './_generated/api';
import { ActionCtx, internalMutation, MutationCtx, query } from './_generated/server';
import { taskEventSchema } from './schema';
import { ensureTaskOwner } from './tasks';

// Exposed -------------------------------------

export const findAll = query({
	args: { taskId: v.id('tasks') },
	handler: async (ctx, { taskId }) => {
		//
		await ensureTaskOwner(ctx, { taskId });

		return await ctx.db
			.query('taskEvents')
			.withIndex('by_task', (q) => q.eq('taskId', taskId))
			.collect();
	},
});

// Internal (no authorization)------------------------------------
export const _add = internalMutation({
	args: {
		event: taskEventSchema,
	},
	handler: async (ctx, { event }) => {
		//
		console.debug('add event', event);

		return await ctx.db.insert('taskEvents', event);
	},
});

// Helper functions ------------------------------------

export const _addTaskEvent = async (
	ctx: ActionCtx | MutationCtx, //
	event: Infer<typeof taskEventSchema>,
) => {
	if ('runAction' in ctx) {
		return await ctx.runMutation(internal.taskEvents._add, { event });
	} else {
		return await _add(ctx as MutationCtx, { event });
	}
};
