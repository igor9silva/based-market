import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { ActionCtx, MutationCtx } from './_generated/server';
import { internalMutation, query } from './lib';
import { authorSchema } from './schemas/author';
import { taskEventSchema } from './schemas/taskEvent';
import { ensureTaskOwner } from './tasks';
// Exposed -------------------------------------

export const findAll = query({
	args: { taskId: zid('tasks') },
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

const addTaskEvent = async (
	ctx: ActionCtx | MutationCtx, //
	event: z.infer<typeof taskEventSchema>,
) => {
	if ('runAction' in ctx) {
		return await ctx.runMutation(internal.taskEvents._add, { event });
	} else {
		return await _add(ctx as MutationCtx, { event });
	}
};

export const _addTaskAddEvent = async (
	ctx: ActionCtx | MutationCtx, //
	event: {
		taskId: Id<'tasks'>;
		author: z.infer<typeof authorSchema>;
	},
) => {
	return await addTaskEvent(ctx, {
		taskId: event.taskId,
		author: event.author,
		kind: 'add',
	});
};

export const _addTaskUpdateEvent = async (
	ctx: ActionCtx | MutationCtx, //
	event: {
		taskId: Id<'tasks'>;
		author: z.infer<typeof authorSchema>;
		changes: string;
	},
) => {
	return await addTaskEvent(ctx, {
		taskId: event.taskId,
		author: event.author,
		kind: 'update',
		changes: event.changes,
	});
};

export const _addTaskMarkAsDoneEvent = async (
	ctx: ActionCtx | MutationCtx, //
	event: {
		taskId: Id<'tasks'>;
		author: z.infer<typeof authorSchema>;
		isDone: boolean;
	},
) => {
	return await addTaskEvent(ctx, {
		taskId: event.taskId,
		author: event.author,
		isDone: event.isDone,
		kind: 'markAsDone',
	});
};

export const _addActionRequestEvent = async (
	ctx: ActionCtx | MutationCtx,
	event: {
		taskId: Id<'tasks'>;
		actionId: Id<'taskActions'>;
		actionKind: Doc<'taskActions'>['kind'];
		author: z.infer<typeof authorSchema>;
	},
) => {
	return await addTaskEvent(ctx, {
		...event,
		kind: 'actionRequest',
	});
};

export const _addActionResultEvent = async (
	ctx: ActionCtx | MutationCtx,
	event: {
		taskId: Id<'tasks'>;
		action: Doc<'taskActions'>;
		result: string;
	},
) => {
	return await addTaskEvent(ctx, {
		taskId: event.taskId,
		author: 'meseeks',
		actionId: event.action._id,
		actionKind: event.action.kind,
		error: null,
		result: event.result,
		kind: 'actionResult',
	});
};

export const _addActionErrorEvent = async (
	ctx: ActionCtx | MutationCtx,
	event: {
		taskId: Id<'tasks'>;
		action: Doc<'taskActions'>;
		error: string;
	},
) => {
	// TODO: notify errors
	return await addTaskEvent(ctx, {
		taskId: event.taskId,
		author: 'meseeks',
		actionId: event.action._id,
		actionKind: event.action.kind,
		error: event.error,
		result: null,
		kind: 'actionResult',
	});
};
