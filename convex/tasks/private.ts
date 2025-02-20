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
					body: undefined, // not sending body to avoid too much data
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
		body: z.string(),
		parentId: zid('tasks').optional(),
		initialFunds: z.number().min(0).max(100000).optional(),
	},
	handler: async (ctx, { author, owner, body, parentId, title, initialFunds }) => {
		//
		const taskId = await ctx.db.insert('tasks', {
			author,
			owner,
			isDone: false,
			parentId,
			title,
		});

		if (initialFunds) {
			await _increaseBudget(ctx, { taskId, amount: initialFunds });
		}

		await _addAction(ctx, {
			taskId,
			author,
			owner,
			toolKey: 'say',
			args: { message: body },
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
			title: 'Look at me!',
			body: `
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
			isDone: false,
		});

		await _increaseBudget(ctx, { taskId, amount: 1 });

		// await _addAction(ctx, {
		// 	taskId,
		// 	author,
		// 	owner,
		// 	toolKey: 'say',
		// 	args: { message: body },
		// });

		// TODO: create a 2nd decision tool, for onboarding
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

		if (!task.body) return;

		const { embedding, usage } = await embed({
			model: openai.embedding('text-embedding-3-large'),
			value: task.body,
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
		author: authorSchema,
		title: z.string().optional(),
		body: z.string().optional(),
	},
	handler: async (ctx, { taskId, title, body, author }) => {
		//
		return await ctx.db.patch(taskId, {
			...(title !== undefined && { title }),
			...(body !== undefined && { body }),
		});
	},
});

export const _markAsDone = internalMutation({
	args: {
		taskId: zid('tasks'),
		isDone: z.boolean(),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, isDone, author }) => {
		//
		if (isDone) {
			//
			const task = await _findOne(ctx, { taskId });
			if (!task) throw new Error('Task not found');

			if (task.balanceUSD && task.balanceUSD > 0) {
				await _removeFunds(ctx, { taskId, amount: task.balanceUSD });
				await ctx.db.patch(taskId, { balanceUSD: 0 });
			}
		}

		return await ctx.db.patch(taskId, { isDone });
	},
});

export const _useFunds = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.number().min(0),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task) throw new Error('Task not found');

		const currentBalance = task.balanceUSD ?? 0;
		console.debug('useFunds', amount, currentBalance, taskId);
		if (currentBalance < amount) throw new Error('Insufficient funds on task');

		// update the task balance
		await ctx.db.patch(taskId, { balanceUSD: currentBalance - amount });
	},
});

export const _increaseBudget = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.number().min(0),
	},
	handler: async (ctx, { taskId, amount }) => {
		//
		const task = await _findOne(ctx, { taskId });
		if (!task) throw NotFound();

		const user = await _findOneUser(ctx, { userId: task.owner });
		if (!user) throw NotFound();

		const currentBalance = user.balanceUSD ?? 0;
		if (currentBalance < amount) throw InsufficientAccountFunds();

		// create the transaction
		console.debug('increaseBudget to task', taskId, amount);
		await _addFundTask(ctx, {
			taskId,
			owner: task.owner,
			value: {
				symbol: 'USD',
				amount: -amount,
			},
		});

		// update the task balance
		await ctx.db.patch(taskId, { balanceUSD: (task.balanceUSD ?? 0) + amount });
	},
});

export const _removeFunds = internalMutation({
	args: {
		taskId: zid('tasks'),
		amount: z.number().min(0),
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
		await ctx.db.patch(taskId, { balanceUSD: (task.balanceUSD ?? 0) - amount });
	},
});

export const _move = internalMutation({
	args: {
		taskId: zid('tasks'),
		newParentId: zid('tasks').optional(),
		author: authorSchema,
	},
	handler: async (ctx, { taskId, newParentId, author }) => {
		//
		return await ctx.db.patch(taskId, { parentId: newParentId });

		// TODO: forbid adding to itself
		// TODO: report to parents as well, old and new
	},
});
