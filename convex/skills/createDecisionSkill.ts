import { tool as AITool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { _askMagicRock } from '../magicRock';
import { decisionSkillSchema } from '../schemas/skillSchema';
import { stringToZod } from '../utils/zodToString';

export function createDecisionSkill(
	ctx: ActionCtx,
	task: Doc<'tasks'>,
	action: Doc<'actions'> | undefined,
	skill: z.infer<typeof decisionSkillSchema>,
) {
	//
	const metadata = {
		description: skill.description,
		parameters: stringToZod(skill.parametersSchema),
	};

	if (!action) return AITool(metadata);

	return AITool({
		...metadata,
		execute: async (args) => {
			//
			console.debug('Running decision skill', skill.key, args);

			const result = await _askMagicRock(ctx, task, action, skill.config.instructions);

			switch (result.finishReason) {
				//
				case 'tool-calls':
					//
					// TODO: think about parallelizing tool calls
					const toolCalls = await Promise.allSettled(
						result.toolCalls.map(async (call) => {
							//
							return ctx.runMutation(internal.action.private._add, {
								skillKey: call.toolName,
								args: call.args,
								taskId: task._id,
								author: action._id,
								owner: task.owner,
							});
						}),
					);

					// TODO: notify errors
					toolCalls
						.filter((call) => call.status === 'rejected')
						.forEach((call) => {
							console.error('skill call failed', call.reason);
						});

					break;

				case 'stop':
					// if (result.text.length < 1) break;
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: result.text },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				case 'error':
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: result.text },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				case 'content-filter':
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: `[damn @sama] Content filter hit: ${result.warnings}` },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				case 'length':
					// TODO: better handling of max length
					await ctx.runMutation(internal.action.private._add, {
						skillKey: 'say',
						args: { message: `Max length hit: ${result.warnings}` },
						taskId: task._id,
						author: action._id,
						owner: task.owner,
					});
					break;

				default:
					throw new Error(`Unknown finish reason: ${result.finishReason}`);
			}

			return result.toolCalls.map((call) => `${call.toolName}()`).join(', ') ?? 'done';
		},
	});
}
