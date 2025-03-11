import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../../_generated/api';
import { Doc, Id } from '../../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../../_generated/server';
import { internalAction, internalMutation } from '../../lib';
import { env } from '../../schemas/envSchema';
import { skillSchema } from '../../schemas/skillSchema';
import { tokenSchema } from '../../schemas/topUpSchema';
import { calculateProviderCost } from '../../skills/createAITool';
import { createTool } from '../../skills/tools';
import { _useFunds } from '../../tasks/private';
import { asDollars } from '../../utils/money';

// TODO: if that since we dropped support for sync actions, we can use ActionCtx only, and remove MutationCtx from the arg type
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

			// check budget
			const expectedCost = await _ensureWithinBudget(ctx, task, action, skill);
			console.debug(`Expected cost ${asDollars({ bigInt: expectedCost, precision: 6 })} USD.`);

			// if the action is not yet authorized, try auto-approving it
			if (!action.approvedAt) {
				//
				const wasAutoApproved = await _tryAutoApprove(ctx, task, action, skill, expectedCost);

				// if failed, request human approval
				if (!wasAutoApproved) return await _requestHumanApproval(ctx, actionId);
			}

			const tool = createTool(ctx, task, action, skill);
			const args = parseArgs(tool, action.args);

			// @ts-expect-error we intentionally do not support exposing toolCallId or message history to the tool execution
			const { result, costs, reactions } = await tool.execute(args);

			await _setResolved(ctx, {
				actionId,
				result: result ?? 'unknown',
				status: 'succeeded',
				costs: costs,
				// TODO: also persist reactions
			});

			// schedule all reactions
			// TODO: optimize using a single mutation
			await Promise.all(reactions.map((reaction) => ctx.runMutation(internal.action.private._add, reaction)));
			//
		} catch (error) {
			//
			console.error(`action ${actionId} execution failed: ${error}`); // TODO: notify

			// TODO: with the new flow we lost the ability to fix itself on errors

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

// export const _react = internalMutation({
// 	args: {
// 		taskId: zid('tasks'),
// 		author: authorSchema,
// 	},
// 	handler: async (ctx, { taskId, author }) => {
// 		//
// 		const task = await _findOneTask(ctx, { taskId });

// 		if (task.isDone) {
// 			console.debug(`Skipping reacting for task ${taskId} because it's already done.`);
// 			return;
// 		}

// 		await _skipAllEnqueuedReactions(ctx, { taskId });

// 		// TODO: optimization: skip feedback() if the task has no summary
// 		// if (!task.summary) {
// 		// 	return await _add(ctx, {
// 		// 		taskId,
// 		// 		author,
// 		// 		owner: task.owner,
// 		// 		skillKey: 'refineTask',
// 		// 		args: {},
// 		// 	});
// 		// }

// 		return await _add(ctx, {
// 			taskId,
// 			author,
// 			owner: task.owner,
// 			skillKey: 'feedback',
// 			args: {},
// 		});
// 	},
// });

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

		// // this if avoids silicon-based life forms to take over
		// if (
		// 	action.skillKey !== 'feedback' &&
		// 	action.skillKey !== 'askForClarification' &&
		// 	action.skillKey !== 'refineTask'
		// ) {
		// 	// TODO: make this configurable
		// 	await _react(ctx, { taskId: action.taskId, author: action._id });
		// }
	},
});

function parseArgs(tool: ReturnType<typeof createTool>, args: unknown) {
	//
	const parsedArgs = tool.parameters.safeParse(args);

	if (!parsedArgs.success) throw new Error(`Invalid skill args: ${parsedArgs.error.message}`);

	return parsedArgs.data;
}

function estimateCostFor(
	skill: z.infer<typeof skillSchema>, //
	actionId: Id<'actions'>,
) {
	//
	if (skill.cost !== 'dynamic') return skill.cost;

	const instructionsLength = skill.config.instructions.length;

	const inputTokens = Math.ceil(instructionsLength / env.CHAR_PER_TOKEN); // TODO: properly account for tools
	const outputTokens = Math.ceil(Math.min(375, inputTokens / 2)); // half of input tokens, but min. 375

	const providerCost = calculateProviderCost(inputTokens, outputTokens, 0);
	const actionCost = env.ACTION_COST_USD;
	const totalCost = providerCost + actionCost;

	// Add a fixed margin to account for unpredictable costs, like repairing tools and output size
	const marginPercent = env.COST_PREDICTION_MARGIN / 100;
	const marginFactor = 100n + BigInt(Math.round(marginPercent * 100));
	const totalCostWithMargin = (totalCost * marginFactor) / 100n;

	console.debug(
		`Estimated cost for ${skill.key} (${actionId}): ${asDollars({ bigInt: totalCostWithMargin, precision: 6 })} USD`,
	);
	console.debug(`Input tokens: ${inputTokens}, instruction length: ${instructionsLength}`);
	console.debug(`Output tokens: ${outputTokens}`);

	// TODO: what about history? 💀

	return totalCostWithMargin;
}

async function _expectedCostFor(
	ctx: ActionCtx | MutationCtx,
	action: Doc<'actions'>,
	skill: z.infer<typeof skillSchema>,
) {
	if (action.estimatedCost) return action.estimatedCost;

	const estimatedCost = estimateCostFor(skill, action._id);

	console.debug(
		`Setting estimated cost for ${action._id}: ${asDollars({ bigInt: estimatedCost, precision: 6 })} USD`,
	);

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

async function _autoApprove(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
) {
	await ctx.runMutation(internal.action.private._authorize, {
		taskId: task._id,
		actionId: action._id,
		approver: 'auto',
		approved: true,
	});

	return true;
}

async function _tryAutoApprove(
	ctx: ActionCtx | MutationCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof skillSchema>,
	expectedCost: bigint,
) {
	// return false; // TODO: remove

	// auto approve if the author is the task owner
	if (action.author === task.owner) return _autoApprove(ctx, task, action);

	// reject if requires more budget
	if (skill.preApprovedCost === 'none') return false;
	if (skill.preApprovedCost < expectedCost) return false;

	// reject if too many consecutive actions are from Meseeks
	if (await _hasReachedMaxConsecutiveCompanionActions(ctx, task)) {
		//
		console.debug(
			`Skipping reacting for task ${task._id} because the last ${env.MAX_CONSECUTIVE_COMPANION_ACTIONS} actions are from Meseeks.`,
		);

		return false;
	}

	return _autoApprove(ctx, task, action);
}

async function _hasReachedMaxConsecutiveCompanionActions(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
) {
	//
	const lastActions = await ctx.runQuery(internal.action.private._findLastActions, {
		taskId: task._id,
		amount: env.MAX_CONSECUTIVE_COMPANION_ACTIONS,
	});

	return lastActions.every((action) => action.author !== task.owner);
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

export async function _runAction(
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

	// skip if there is a pending authorization
	const pendingAuthorization = await ctx.runQuery(internal.action.private._findPendingAuthorization, { taskId });
	if (pendingAuthorization)
		return skip(
			`Skipping next action for task ${taskId} because there is a pending authorization action (${pendingAuthorization.skillKey}, ${pendingAuthorization._id}).`,
		);

	// grab next pending action, skip if there are none
	const nextAction = await ctx.runQuery(internal.action.private._findNext, { taskId });
	if (!nextAction) return skip(`Skipping next action for task ${taskId} because there are no more pending actions.`);

	return await _runAction(ctx, {
		taskId,
		action: nextAction,
	});
}
