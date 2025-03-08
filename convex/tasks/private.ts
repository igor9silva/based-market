import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { _add as _addAction } from '../action/private';
import { internalAction, internalMutation, internalQuery } from '../lib';
import { authorSchema } from '../schemas/authorSchema';
import { _addFundTask, _addRefundTask } from '../transactions/private';
import { _findOne as _findOneUser } from '../users/private';
import { InsufficientAccountFunds, NotFound } from '../utils/errors';
import { asBigInt, asDollars } from '../utils/money';

export const _findOne = internalQuery({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const task = await ctx.db.get(taskId);
		if (!task) throw new Error('Task not found');

		return task;
	},
});

export const _findAllNotEmbedded = internalQuery({
	args: {},
	handler: async (ctx) => {
		//
		return await ctx.db
			.query('tasks')
			.withIndex('by_embeddingId', (q) => q.eq('embeddingId', undefined))
			.collect();
	},
});

export const _findAllByEmbeddingIds = internalQuery({
	args: {
		embeddings: z.array(
			z.object({
				_id: zid('taskEmbeddings'),
				_score: z.number(),
			}),
		),
	},
	handler: async (ctx, { embeddings }) => {
		//
		const tasks = await Promise.all(
			embeddings.map(async ({ _id, _score }) => {
				const task = await ctx.db
					.query('tasks')
					.withIndex('by_embeddingId', (q) => q.eq('embeddingId', _id))
					.unique();

				if (!task) return null;

				return {
					...task,
					description: undefined, // not sending description to avoid too much data
					_score,
				};
			}),
		);

		return tasks.filter((task) => task !== null);
	},
});

export const _findActiveTasks = internalQuery({
	args: {
		owner: zid('users'),
	},
	handler: async (ctx, { owner }) => {
		//
		return await ctx.db
			.query('tasks')
			.withIndex('by_author_isDone', (q) =>
				q
					.eq('author', owner) //
					.eq('isDone', false),
			)
			.collect();
	},
});

export const _add = internalMutation({
	args: {
		author: authorSchema,
		owner: zid('users'),
		title: z.string().optional(),
		details: z.string().optional(),
		parentId: zid('tasks').optional(),
		initialFunds: z
			.bigint()
			.min(0n)
			.max(asBigInt({ dollars: 100000 }))
			.optional(),
	},
	handler: async (ctx, { author, owner, title, details, parentId, initialFunds }) => {
		//
		const taskId = await ctx.db.insert('tasks', {
			author,
			owner,
			parentId,
			title,
			isDone: false,
			availableBudgetUSD: 0n,
		});

		await Promise.all([
			_addAction(ctx, {
				skillKey: 'increaseBudget',
				args: { amount: initialFunds },
				taskId,
				author,
				owner,
			}),
			_addAction(ctx, {
				// TODO: receive an action instead of using hardcoded `say`
				skillKey: 'say',
				args: { message: details },
				taskId,
				author,
				owner,
			}),
		]);

		return taskId;
	},
});

export const _addInboxTask = internalMutation({
	args: {
		author: authorSchema,
		owner: zid('users'),
	},
	handler: async (ctx, { author, owner }) => {
		//
		const taskId = await ctx.db.insert('tasks', {
			author,
			owner,
			title: 'Look at me!',
			isDone: false,
			availableBudgetUSD: 0n,
			details: `
## ooh-wee, welcome to Meseeks! 
Here, everything is a task.
<br />
Every time a task gets **marked as done**, we summarize and learn from it, so other tasks can have amplified context on you and everything you've been doing 😌
<br />
#### This box is the task description.
It's a place were you - **or your Meseeks** - can add details on what you are seeking, constraints, instructions, files, or anything you want.

------------------------------------
Every piece of text is dynamic, **try tapping with 3 fingers** (or middle mouse button) here. Powered by [Markdown](https://en.wikipedia.org/wiki/Markdown) and *React Components* 🔥
<br />
You can do that in messages as well. **Have fun 👻**.

------------------------------------

<p className="text-sm text-muted-foreground">**Tip:** type \`<EasterEgg />\` in the chatbox.</p>

------------------------------------
Oh, there is one more thing. **Verified humans get 500 actions ⚡ for free!**
<br />
On the command bar you should see your balance: <Balance />
<br />
Each task gets it's own budget until it's done. **The larger the budget, the more autonomous it gets.**
<br />
If you need more funds, look for "Top up".
<br />
Happy hacking 🚀
`.trim(),
		});

		await _increaseBudget(ctx, { taskId, amount: 1n });

		// await _addAction(ctx, {
		// 	taskId,
		// 	author,
		// 	owner,
		// 	skillKey: 'say',
		// 	args: { message: description },
		// });

		// TODO: create a 2nd decision skill, for onboarding
		// TODO: insert a few actions

		return taskId;
	},
});

export const _semanticSearch = internalAction({
	args: {
		query: z.string(),
	},
	handler: async (ctx, { query }): Promise<Array<Doc<'tasks'> & { _score: number }>> => {
		//
		const { embedding, usage } = await embed({
			model: openai.embedding('text-embedding-3-large'),
			value: query,
		});

		console.log('embedding usage', usage);

		const results = await ctx.vectorSearch('taskEmbeddings', 'by_embedding', {
			vector: embedding,
			limit: 16,
			// filter: (q) => q.eq('isDone', false),
		});

		const tasks = await ctx.runQuery(internal.tasks.private._findAllByEmbeddingIds, {
			embeddings: results,
		});

		return tasks;
	},
});

export const _addEmbedding = internalMutation({
	args: {
		taskId: zid('tasks'),
		embedding: z.array(z.number()),
		isDone: z.boolean(),
	},
	handler: async (ctx, { taskId, embedding, isDone }) => {
		//
		const embeddingId = await ctx.db.insert('taskEmbeddings', { taskId, embedding, isDone });
		await ctx.db.patch(taskId, { embeddingId });
	},
});

export const _removeEmbedding = internalMutation({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task.embeddingId) return;

		await ctx.db.patch(taskId, { embeddingId: undefined });
		await ctx.db.delete(task.embeddingId);
	},
});

export const _embedTask = internalAction({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		//
		const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });

		if (!task.details) return;

		const { embedding, usage } = await embed({
			model: openai.embedding('text-embedding-3-large'),
			value: task.details,
		});

		console.log('embedding usage', usage);

		await ctx.runMutation(internal.tasks.private._addEmbedding, {
			taskId,
			embedding,
			isDone: task.isDone,
		});
	},
});

export const _embedAllMissingTasks = internalAction({
	args: {},
	handler: async (ctx) => {
		//
		const tasks = await ctx.runQuery(internal.tasks.private._findAllNotEmbedded);

		for (const task of tasks) {
			await ctx.runAction(internal.tasks.private._embedTask, { taskId: task._id });
		}
	},
});

export const _update = internalMutation({
	args: {
		taskId: zid('tasks'),
		title: z.string().optional(),
		details: z.string().optional(),
	},
	handler: async (ctx, { taskId, title, details }) => {
		//
		if (title === undefined && details === undefined) throw new Error('No changes to update');

		return await ctx.db.patch(taskId, {
			...(title !== undefined && { title }),
			...(details !== undefined && { details }),
			lastSummarizedAt: Date.now(),
		});
	},
});

export const _markAsDone = internalMutation({
	args: {
		taskId: zid('tasks'),
		isDone: z.boolean(),
	},
	handler: async (ctx, { taskId, isDone }) => {
		//
		if (isDone) {
			//
			const task = await _findOne(ctx, { taskId });
			if (!task) throw new Error('Task not found');

			if (task.availableBudgetUSD && task.availableBudgetUSD > 0) {
				await _removeFunds(ctx, { taskId, amount: task.availableBudgetUSD });
				await ctx.db.patch(taskId, { availableBudgetUSD: 0n });
			}
		}

		return await ctx.db.patch(taskId, { isDone });
	},
});

export const _setResolution = internalMutation({
	args: {
		taskId: zid('tasks'),
		resolution: z.string().optional(),
	},
	handler: async (ctx, { taskId, resolution }) => {
		//
		return await ctx.db.patch(taskId, { resolution });
	},
});

export const _resolve = internalMutation({
	args: {
		taskId: zid('tasks'),
		resolution: z.string().optional(),
	},
	handler: async (ctx, { taskId, resolution }) => {
		//
		// const task = await execution.ctx.runQuery(internal.tasks.private._findOne, {
		// 	taskId: execution.task._id,
		// });

		// 1. Set resolution if provided
		if (resolution) {
			//
			// const finalResolution = args.resolution || 'Task completed successfully.';
			// TODO: generate resolution if needed

			await ctx.runMutation(internal.tasks.private._setResolution, {
				taskId,
				resolution,
			});
			//
		}

		// 2. Mark task as done (which will refund any unused funds)
		await ctx.runMutation(internal.tasks.private._markAsDone, {
			taskId,
			isDone: true,
		});

		// await execution.ctx.runMutation(internal.action.private._add, {
		// 	taskId: execution.task._id,
		// 	author: execution.action.author,
		// 	owner: execution.task.owner,
		// 	skillKey: '_learnFromTask',
		// 	args: {},
		// });
	},
});
// export const _learn = internalAction({
// 	args: {
// 		taskId: zid('tasks'),
// 	},
// 	handler: async (ctx, { taskId }) => {
// 		//
// 		const task = await ctx.runQuery(internal.tasks.private._findOne, { taskId });
// 		if (!task) throw new Error('Task not found');

// 		if (!task.resolution) {
// 			console.warn('Cannot learn from task without resolution', taskId);
// 			return false;
// 		}

// 		// TODO: Implement learning logic here
// 		// This would typically involve:
// 		// 1. Extracting knowledge from the task and its resolution
// 		// 2. Storing this knowledge in a knowledge base
// 		// 3. Updating embeddings or other data structures for future reference

// 		console.log('Learning from task', taskId);

// 		// Re-embed the task with its resolution for better semantic search
// 		// await ctx.runAction(internal.tasks.private._embedTask, { taskId });

// 		return true;
// 	},
// });

export const _useFunds = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.bigint().min(0n),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task) throw new Error('Task not found');

		console.debug(`using ${asDollars({ bigInt: amount })} from task ${taskId}`);

		if (task.availableBudgetUSD < amount) {
			//
			console.warn(
				'Insufficient funds on task',
				taskId,
				'cost',
				asDollars({ bigInt: amount }),
				'available',
				asDollars({ bigInt: task.availableBudgetUSD }),
				'missing',
				asDollars({ bigInt: amount - task.availableBudgetUSD }),
				'Will use all available funds',
			);

			amount = task.availableBudgetUSD;
		}

		// update the task balance
		await ctx.db.patch(taskId, { availableBudgetUSD: task.availableBudgetUSD - amount });
	},
});

export const _increaseBudget = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.bigint().min(0n),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task) throw NotFound();

		const user = await _findOneUser(ctx, { userId: task.owner });
		if (!user) throw NotFound();

		const currentBalance = user.balanceUSD ?? 0n;

		console.debug(
			'increasing budget to task',
			taskId,
			asDollars({ bigInt: amount }),
			'current balance',
			asDollars({ bigInt: currentBalance }),
		);

		if (currentBalance < amount) throw InsufficientAccountFunds();

		// TODO: shouldn't this be an action?
		// create the transaction
		await _addFundTask(ctx, {
			taskId,
			owner: task.owner,
			value: {
				symbol: 'USD',
				amount: -amount,
			},
		});

		// update the task balance
		await ctx.db.patch(taskId, { availableBudgetUSD: task.availableBudgetUSD + amount });
	},
});

export const _removeFunds = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.bigint().min(0n),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task) throw new Error('Task not found');

		// create the transaction
		await _addRefundTask(ctx, {
			taskId,
			owner: task.owner,
			value: { symbol: 'USD', amount },
			description: 'Refund of unused funds',
		});

		// update the task balance
		await ctx.db.patch(taskId, { availableBudgetUSD: task.availableBudgetUSD - amount });
	},
});

export const _move = internalMutation({
	args: {
		taskId: zid('tasks'),
		newParentId: zid('tasks').optional(),
	},
	handler: async (ctx, { taskId, newParentId }) => {
		//
		return await ctx.db.patch(taskId, { parentId: newParentId });

		// TODO: forbid adding to itself
		// TODO: report to parents as well, old and new
	},
});
