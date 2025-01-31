import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../../_generated/server';
import { internalAction, internalMutation } from '../../lib';
import { authorSchema } from '../../schemas/authorSchema';
import { _allTools } from '../../tools/private';
import { _add } from '../private';

export const _execute = internalAction({
	args: {
		author: authorSchema,
		taskId: zid('tasks'),
		actionId: zid('actions'),
	},
	handler: async (ctx, { taskId, actionId, author }) => {
		//
		try {
			//
			// make sure the action is a tool
			const action = await ctx.runQuery(internal.action.private._findOne, { actionId });
			if (action.kind !== 'async') throw new Error('Expected an async action.');

			// grab the task
			const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });

			// get the tool TODO: optmize
			const availableTools = await _allTools(ctx, task, action);
			const tool = availableTools[action.toolKey as keyof typeof availableTools];

			console.debug('tool key', action.toolKey);
			console.debug('availableTools', Object.keys(availableTools));

			if (!tool) throw new Error(`Unknown tool: ${action.toolKey}`);

			const parsedArgs = tool.parameters.safeParse(action.args);
			if (!parsedArgs.success) throw new Error(`Invalid tool args: ${parsedArgs.error.message}`);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool
			const result = await tool.execute(parsedArgs.data);

			console.debug(`${actionId} executed with result: ${result}`);
			if (!result) console.warn(`${actionId} executed with no result`);

			await _setResolved(ctx, {
				actionId,
				result: result ?? 'unknown',
				status: 'succeeded',
			});
			//
		} catch (error) {
			//
			console.error('error in tool', error); // TODO: notify

			await _setResolved(ctx, {
				actionId,
				result: `${error instanceof Error ? error.message : 'Unknown error'}`,
				status: 'failed',
			});
			//
		} finally {
			//
			await _runNextActionIfNeeded(ctx, { taskId, author });
		}
	},
});

export const _react = internalMutation({
	args: {
		taskId: zid('tasks'),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, author }) => {
		//
		// TODO: skip other previously scheduled reactions
		console.debug(`${author} reacts`);

		// TODO: get the task and check if it's done before reacting
		const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });

		if (task.isDone) {
			console.debug(`Skipping reacting for task ${taskId} because it's already done.`);
			return;
		}

		// TODO: check if the last 10 actions are from meseeks (action.author !== task.author) before reacting
		const allActions = await ctx.runQuery(internal.action.private._findAll, { taskId });
		const last10Actions = allActions.slice(-10).filter((action) => action.author !== task.author);

		if (last10Actions.length >= 10) {
			console.debug(`Skipping reacting for task ${taskId} because the last 10 actions are from meseeks.`);
			return;
		}

		// TODO: what if this 👆 is done inside the react execute function?

		const pendingReactions = await ctx.db
			.query('actions')
			.withIndex('by_task_status', (q) =>
				q
					.eq('taskId', taskId) //
					.eq('status', 'enqueued'),
			)
			.filter((q) => q.eq(q.field('toolKey'), 'react'))
			.collect();

		console.debug('pending reactions', pendingReactions);

		await Promise.all(
			pendingReactions.map((action) =>
				ctx.db.patch(action._id, {
					status: 'skipped',
					result: 'outdated — new actions happened before this action could run',
				}),
			),
		);

		return await _add(ctx, {
			taskId,
			author,
			toolKey: 'react',
			args: {},
		});
	},
});

export const _start = internalMutation({
	args: {
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		console.debug(`${actionId} starts`);

		return await ctx.db.patch(actionId, { status: 'running' });
	},
});

export const _resolve = internalMutation({
	args: {
		actionId: zid('actions'),
		result: z.string(),
		status: z.enum(['succeeded', 'failed']),
	},
	handler: async (ctx, { actionId, result, status }) => {
		//
		console.debug(`${actionId} resolved with ${status} and ${result}`);

		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');
		if (action.result) throw new Error('Action result already set');

		await ctx.db.patch(actionId, { result, status });

		// this if avoids silicon-based life forms to take over
		if (action.toolKey !== 'react' && action.toolKey !== 'doNothing') {
			await _react(ctx, { taskId: action.taskId, author: action._id });
		}
	},
});

async function _setResolved(
	ctx: ActionCtx | MutationCtx,
	args: {
		actionId: Id<'actions'>;
		result: string;
		status: 'succeeded' | 'failed';
	},
) {
	return await ctx.runMutation(internal.action.lifecycle.private._resolve, args);
}

async function _scheduleAction(
	ctx: ActionCtx | MutationCtx,
	{
		author,
		taskId,
		action,
	}: {
		author: z.infer<typeof authorSchema>;
		taskId: Id<'tasks'>;
		action: Doc<'actions'>;
	},
) {
	if (action.result) throw new Error('Action is already done.');
	if (action.kind === 'sync') throw new Error('Will never run, just narrowing types.');

	// ideally, status=`running` would be set in the action itself, but that'd lead into a race condition
	await ctx.runMutation(internal.action.lifecycle.private._start, { actionId: action._id });

	return await ctx.scheduler.runAfter(0, internal.action.lifecycle.private._execute, {
		taskId,
		actionId: action._id,
		author,
	});
}

export async function _runNextActionIfNeeded(
	ctx: ActionCtx | MutationCtx,
	{
		taskId,
		author,
	}: {
		taskId: Id<'tasks'>;
		author: z.infer<typeof authorSchema>;
	},
) {
	const skip = (message: string) => console.info(message);

	// skip if there are running actions
	const runningAction = await ctx.runQuery(internal.action.private._findRunning, { taskId });
	if (runningAction)
		return skip(
			`Skipping next action for task ${taskId} because there is a running action (${runningAction.toolKey}, ${runningAction._id}).`,
		);

	// grab next pending action, skip if there are none
	const nextAction = await ctx.runQuery(internal.action.private._findNext, { taskId });
	if (!nextAction) return skip(`Skipping next action for task ${taskId} because there are no more pending actions.`);

	return await _scheduleAction(ctx, {
		taskId,
		author,
		action: nextAction,
	});
}
