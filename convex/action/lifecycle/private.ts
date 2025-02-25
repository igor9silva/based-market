import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../../_generated/server';
import { internalAction, internalMutation } from '../../lib';
import { authorSchema } from '../../schemas/authorSchema';
import { skillSchema } from '../../schemas/skillSchema';
import { tokenSchema } from '../../schemas/topUpSchema';
import { createTool } from '../../skills/tools';
import { _findOne as _findOneTask } from '../../tasks/private';
import { asBigInt, asDollars } from '../../utils/money';
import { _add, _findAll as _findAllActions } from '../private';

export const _execute = internalAction({
	args: {
		taskId: zid('tasks'),
		actionId: zid('actions'),
	},
	handler: async (ctx, { taskId, actionId }) => {
		//
		// ensureWithinBudget()
		// 		checks if `expectedCost() < task.availableBudgetUSD`
		// 		otherwise fails with <IncreaseTaskBudgetCard taskId='${taskId}' />
		// authorize()
		// 		try automatic approval: check if skill.preApprovedCost < expectedCost()
		// 		otherwise status go `pending authorization`

		// 'built-in' skills are free of charge
		// also bring the "max consecutive" logic to here, from react()

		try {
			//
			const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });
			const action = await ctx.runQuery(internal.action.private._findOne, { actionId });
			const skill = await ctx.runQuery(internal.skills.private._findOne, {
				key: action.skillKey,
				owner: task.owner,
			});

			console.debug(`Executing action (${action.skillKey}) ${actionId} for task ${taskId}`);

			const expectedCost = await _ensureWithinBudget(ctx, task, action, skill);
			const authorized = await _authorize(ctx, actionId, skill, expectedCost);

			if (!authorized) return;

			const tool = createTool(ctx, task, action, skill);

			const parsedArgs = tool.parameters.safeParse(action.args);
			if (!parsedArgs.success) throw new Error(`Invalid skill args: ${parsedArgs.error.message}`);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool execution
			const result = await tool.execute(parsedArgs.data);

			// TODO: skills should return { result, costs, usage, ... }

			const costs = [
				{
					symbol: 'USD' as const,
					amount: expectedCost,
					description: 'Skill usage',
				},
			];
			const totalCost = costs.reduce((acc, cost) => acc + cost.amount, 0n);

			if (totalCost > 0) {
				await ctx.runMutation(internal.tasks.private._useFunds, { taskId: action.taskId, amount: totalCost });
			}

			console.debug(`${actionId} (${action.skillKey}) executed`);
			if (!result) console.warn(`${actionId} (${action.skillKey}) executed with no result`);

			await _setResolved(ctx, {
				actionId,
				result: result ?? 'unknown',
				status: 'succeeded',
				costs: costs,
			});
			//
		} catch (error) {
			//
			console.error('error in skill', error); // TODO: notify

			await _setResolved(ctx, {
				actionId,
				result: `${error instanceof Error ? error.message : 'Unknown error'}`,
				status: 'failed',
				costs: [],
			});
			//
		} finally {
			//
			await _runNextActionIfNeeded(ctx, taskId);
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
		const task = await _findOneTask(ctx, { taskId });

		if (task.isDone) {
			console.debug(`Skipping reacting for task ${taskId} because it's already done.`);
			return;
		}

		// TODO: check if the last 50 actions are from meseeks (action.author !== task.author) before reacting
		const allActions = await _findAllActions(ctx, { taskId });
		const last50Actions = allActions.slice(-50).filter((action) => action.author !== task.author);

		if (last50Actions.length >= 50) {
			console.debug(`Skipping reacting for task ${taskId} because the last 50 actions are from meseeks.`);
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
			.filter((q) => q.eq(q.field('skillKey'), 'react'))
			.collect();

		console.debug('pending reactions', pendingReactions);

		await Promise.all(
			pendingReactions.map((action) =>
				ctx.db.patch(action._id, {
					status: 'skipped',
					result: 'outdated — new actions happened before this action could run',
					costs: [],
				}),
			),
		);

		return await _add(ctx, {
			taskId,
			author,
			owner: task.owner,
			skillKey: 'react',
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

export const _setEstimatedCost = internalMutation({
	args: {
		actionId: zid('actions'),
		estimatedCost: z.bigint(),
	},
	handler: async (ctx, { actionId, estimatedCost }) => {
		return await ctx.db.patch(actionId, { estimatedCost });
	},
});

export const _requestAuthorization = internalMutation({
	args: {
		actionId: zid('actions'),
	},
	handler: async (ctx, { actionId }) => {
		//
		console.debug(`requesting authorization for ${actionId}`);

		return await ctx.db.patch(actionId, { status: 'pending authorization' });
	},
});
export const _resolve = internalMutation({
	args: {
		actionId: zid('actions'),
		result: z.string(),
		status: z.enum(['succeeded', 'failed']),
		costs: z.array(
			z.object({
				symbol: tokenSchema,
				amount: z.bigint(),
				description: z.string(),
			}),
		),
	},
	handler: async (ctx, { actionId, result, status, costs }) => {
		//
		console.debug(`${actionId} resolved with ${status} and ${result}`);

		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');
		if (action.result) throw new Error('Action result already set');

		await ctx.db.patch(actionId, { result, status, costs });

		// this if avoids silicon-based life forms to take over
		if (action.skillKey !== 'react' && action.skillKey !== 'askForClarification') {
			await _react(ctx, { taskId: action.taskId, author: action._id });
		}
	},
});

function estimateCostFor(skill: z.infer<typeof skillSchema>) {
	//
	if (skill.cost !== 'dynamic') return skill.cost;

	// TODO: implement dynamic cost
	return asBigInt({ dollars: 0.01 });
}

async function _expectedCostFor(
	ctx: ActionCtx | MutationCtx,
	action: Doc<'actions'>,
	skill: z.infer<typeof skillSchema>,
) {
	if (action.estimatedCost) return action.estimatedCost;

	const estimatedCost = estimateCostFor(skill);

	await ctx.runMutation(internal.action.lifecycle.private._setEstimatedCost, {
		actionId: action._id,
		estimatedCost,
	});

	return estimatedCost;
}

async function _ensureWithinBudget(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof skillSchema>,
) {
	//
	const expectedCost = await _expectedCostFor(ctx, action, skill);

	if (expectedCost > task.availableBudgetUSD) {
		throw new Error(
			`Not enough budget. Expected cost: ${asDollars({ bigInt: expectedCost })}.\n<IncreaseTaskBudgetCard taskId='${task._id}' />`,
		);
	}

	return expectedCost;
}

async function _authorize(
	ctx: ActionCtx | MutationCtx,
	actionId: Id<'actions'>,
	skill: z.infer<typeof skillSchema>,
	expectedCost: bigint,
) {
	//
	if (skill.preApprovedCost === 'none' || skill.preApprovedCost < expectedCost) {
		await ctx.runMutation(internal.action.lifecycle.private._requestAuthorization, { actionId });
		return false;
	}

	return true;
}

async function _setResolved(
	ctx: ActionCtx | MutationCtx,
	args: {
		actionId: Id<'actions'>;
		result: string;
		status: 'succeeded' | 'failed';
		costs: Array<{
			symbol: z.infer<typeof tokenSchema>;
			amount: bigint;
			description: string;
		}>;
	},
) {
	return await ctx.runMutation(internal.action.lifecycle.private._resolve, args);
}

async function _runAction(
	ctx: ActionCtx | MutationCtx,
	{
		taskId,
		action,
	}: {
		taskId: Id<'tasks'>;
		action: Doc<'actions'>;
	},
) {
	if (action.result) throw new Error('Action is already done.');

	// TODO: check budget here

	// ideally, status=`running` would be set in the action itself, but that'd lead into a race condition
	await ctx.runMutation(internal.action.lifecycle.private._start, { actionId: action._id });

	return await ctx.scheduler.runAfter(0, internal.action.lifecycle.private._execute, {
		taskId,
		actionId: action._id,
	});
}

export async function _runNextActionIfNeeded(
	ctx: ActionCtx | MutationCtx, //
	taskId: Id<'tasks'>,
) {
	const skip = (message: string) => console.info(message);

	// skip if there are running actions
	const runningAction = await ctx.runQuery(internal.action.private._findRunning, { taskId });
	if (runningAction)
		return skip(
			`Skipping next action for task ${taskId} because there is a running action (${runningAction.skillKey}, ${runningAction._id}).`,
		);

	// grab next pending action, skip if there are none
	const nextAction = await ctx.runQuery(internal.action.private._findNext, { taskId });
	if (!nextAction) return skip(`Skipping next action for task ${taskId} because there are no more pending actions.`);

	return await _runAction(ctx, {
		taskId,
		action: nextAction,
	});
}
