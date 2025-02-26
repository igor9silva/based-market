import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../../_generated/server';
import { internalAction, internalMutation } from '../../lib';
import { authorSchema } from '../../schemas/authorSchema';
import { env } from '../../schemas/envSchema';
import { skillSchema } from '../../schemas/skillSchema';
import { tokenSchema } from '../../schemas/topUpSchema';
import { calculateProviderCost } from '../../skills/createAITool';
import { createTool } from '../../skills/tools';
import { _findOne as _findOneTask, _useFunds } from '../../tasks/private';
import { asBigInt, asDollars, asInt } from '../../utils/money';
import { _add, _skipAllEnqueuedReactions } from '../private';

export const _execute = internalAction({
	args: {
		taskId: zid('tasks'),
		actionId: zid('actions'),
	},
	handler: async (ctx, { taskId, actionId }) => {
		//
		// TODO: also bring the "max consecutive" logic to here, from react()

		try {
			//
			console.debug(`Executing action ${actionId} for task ${taskId}`);

			const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });
			const action = await ctx.runQuery(internal.action.private._findOne, { actionId });
			const skill = await ctx.runQuery(internal.skills.private._findOne, {
				key: action.skillKey,
				owner: task.owner,
			});

			console.debug(
				`Using skill ${skill.key} with ${Object.keys(action.args).length} args: ${Object.keys(action.args).join(', ')}`,
			);

			const expectedCost = await _ensureWithinBudget(ctx, task, action, skill);
			const authorized = await _authorize(ctx, task, action, skill, expectedCost);

			console.debug(`Expected cost ${asDollars({ bigInt: expectedCost })} USD. Auto-approved? ${authorized}`);

			if (!authorized) return await _requestHumanApproval(ctx, actionId);

			const tool = createTool(ctx, task, action, skill);
			const args = parseArgs(tool, action.args);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool execution
			const { result, costs } = await tool.execute(args);

			await _setResolved(ctx, {
				actionId,
				result: result ?? 'unknown',
				status: 'succeeded',
				costs: costs,
			});
			//
		} catch (error) {
			//
			console.error(`action ${actionId} execution failed: ${error}`); // TODO: notify

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
		const task = await _findOneTask(ctx, { taskId });

		if (task.isDone) {
			console.debug(`Skipping reacting for task ${taskId} because it's already done.`);
			return;
		}

		await _skipAllEnqueuedReactions(ctx, { taskId });

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
		console.debug(`${actionId} resolved with ${status}`);

		const action = await ctx.db.get(actionId);
		if (!action) throw new Error('Action not found');
		if (action.result) throw new Error('Action result already set');

		if (!result) console.warn(`${action.skillKey} (${actionId}) ended with no result`);

		const totalCost = costs.reduce((acc, cost) => acc + cost.amount, 0n);

		console.debug(
			`Resolved as ${status} with ${result.length} characters. Total cost: ${asDollars({ bigInt: totalCost, precision: 6 })}`,
		);

		if (status === 'succeeded' && totalCost > 0) {
			await _useFunds(ctx, { taskId: action.taskId, amount: totalCost });
		}

		await ctx.db.patch(actionId, { result, status, costs });

		// this if avoids silicon-based life forms to take over
		if (action.skillKey !== 'react' && action.skillKey !== 'askForClarification') {
			await _react(ctx, { taskId: action.taskId, author: action._id });
		}
	},
});

function parseArgs(tool: ReturnType<typeof createTool>, args: unknown) {
	//
	const parsedArgs = tool.parameters.safeParse(args);

	if (!parsedArgs.success) throw new Error(`Invalid skill args: ${parsedArgs.error.message}`);

	return parsedArgs.data;
}

function estimateCostFor(skill: z.infer<typeof skillSchema>) {
	//
	if (skill.cost !== 'dynamic') return skill.cost;

	const instructionsLength = skill.config.instructions.length;

	const inputTokens = Math.ceil(instructionsLength / env.CHAR_PER_TOKEN); // TODO: properly account for tools
	const outputTokens = Math.ceil(Math.min(375, inputTokens / 2)); // half of input tokens, but min. 375

	const totalCost = asInt({ bigInt: calculateProviderCost(inputTokens, outputTokens, 0) });

	return asBigInt({
		// add COST_PREDICTION_MARGIN% to the total cost
		dollars: Math.floor(totalCost * (1 + env.COST_PREDICTION_MARGIN / 100)),
	});
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
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof skillSchema>,
	expectedCost: bigint,
) {
	//
	if (action.author === task.owner) return true;

	if (skill.preApprovedCost === 'none' || skill.preApprovedCost < expectedCost) {
		//
		await ctx.runMutation(internal.action.lifecycle.private._requestAuthorization, { actionId: action._id });

		return false;
	}

	const lastActions = await ctx.runQuery(internal.action.private._findLastActions, {
		taskId: task._id,
		amount: env.MAX_CONSECUTIVE_COMPANION_ACTIONS,
	});

	if (lastActions.every((action) => action.author !== task.owner)) {
		//
		console.debug(
			`Skipping reacting for task ${task._id} because the last ${env.MAX_CONSECUTIVE_COMPANION_ACTIONS} actions are from Meseeks.`,
		);

		return false;
	}

	return true;
}

async function _requestHumanApproval(ctx: ActionCtx | MutationCtx, actionId: Id<'actions'>) {
	//
	await ctx.runMutation(internal.action.lifecycle.private._requestAuthorization, { actionId });
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
	//
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
