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
import { asBigInt } from '../utils/money';

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
		summary: z.string().optional(),
		description: z.string(),
		parentId: zid('tasks').optional(),
		initialFunds: z
			.bigint()
			.min(0n)
			.max(asBigInt({ dollars: 100000 }))
			.optional(),
	},
	handler: async (ctx, { author, owner, description, parentId, summary, initialFunds }) => {
		//
		const taskId = await ctx.db.insert('tasks', {
			author,
			owner,
			parentId,
			summary,
			isDone: false,
			availableBudgetUSD: 0n,
		});

		if (initialFunds) {
			await _increaseBudget(ctx, { taskId, amount: initialFunds });
		}

		await _addAction(ctx, {
			taskId,
			author,
			owner,
			skillKey: 'say',
			args: { message: description },
		});

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
			summary: 'Look at me!',
			isDone: false,
			availableBudgetUSD: 0n,
			description: `
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

		if (!task.description) return;

		const { embedding, usage } = await embed({
			model: openai.embedding('text-embedding-3-large'),
			value: task.description,
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
		summary: z.string().optional(),
		description: z.string().optional(),
	},
	handler: async (ctx, { taskId, summary, description }) => {
		//
		return await ctx.db.patch(taskId, {
			...(summary !== undefined && { summary }),
			...(description !== undefined && { description }),
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

export const _useFunds = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.bigint().min(0n),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task) throw new Error('Task not found');

		console.debug('useFunds', amount, task.availableBudgetUSD, taskId);
		if (task.availableBudgetUSD < amount) throw new Error('Insufficient funds on task');

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

		console.debug('increasing budget to task', taskId, amount, 'current balance', user.balanceUSD);

		const currentBalance = user.balanceUSD;
		if (currentBalance < amount) throw InsufficientAccountFunds();

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
