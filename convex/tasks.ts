import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc, Id } from './_generated/dataModel';
import { MutationCtx, QueryCtx } from './_generated/server';
import { internalAction, internalMutation, internalQuery, mutation, query } from './lib';
import { authorSchema } from './schemas/authorSchema';
import { _reportMutation } from './taskEvents';
import { current as getCurrentUser } from './users.js';

// Exposed ------------------------------------

export const findAllAtInbox = query({
	args: {},
	handler: async (ctx) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		const find = ({ isDone }: { isDone: boolean }) =>
			ctx.db
				.query('tasks')
				.withIndex('by_owner_parentId_isDone', (q) =>
					q
						.eq('owner', currentUser._id) //
						.eq('parentId', undefined)
						.eq('isDone', isDone),
				)
				.order('desc')
				.collect();

		const [notDone, done] = await Promise.all([
			find({ isDone: false }), //
			find({ isDone: true }),
		]);

		return notDone.concat(done);
	},
});

export const findAll = query({
	args: {
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { parentId }) => {
		//
		if (!parentId) return await findAllAtInbox(ctx, {});

		await ensureTaskOwner(ctx, { taskId: parentId });

		const find = ({ isDone }: { isDone: boolean }) =>
			ctx.db
				.query('tasks')
				.withIndex('by_parent_isDone', (q) =>
					q
						.eq('parentId', parentId) //
						.eq('isDone', isDone),
				)
				.order('desc')
				.collect();

		const [notDone, done] = await Promise.all([
			find({ isDone: false }), //
			find({ isDone: true }),
		]);

		return notDone.concat(done);
	},
});

export const findOne = query({
	args: {
		taskId: zid('tasks'),
	},
	handler: async (ctx, { taskId }) => {
		const { task } = await ensureTaskOwner(ctx, { taskId });
		return task;
	},
});

export const findOneOrNot = query({
	args: {
		taskId: zid('tasks').optional(),
	},
	handler: async (ctx, { taskId }) => {
		//
		if (!taskId) return undefined;

		const { task } = await ensureTaskOwner(ctx, { taskId });

		return task;
	},
});

export const add = mutation({
	args: {
		body: z.optional(z.string()),
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { body, parentId }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});
		return await _add(ctx, { userId: currentUser._id, body, parentId });
	},
});

export const update = mutation({
	args: {
		taskId: zid('tasks'),
		title: z.optional(z.string()),
		body: z.optional(z.string()),
	},
	handler: async (ctx, { taskId, title, body }) => {
		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		return _update(ctx, { taskId, title, body, author: currentUser._id });
	},
});

export const markAsDone = mutation({
	args: {
		taskId: zid('tasks'),
		isDone: z.boolean(),
	},
	handler: async (ctx, { taskId, isDone }) => {
		//
		const { currentUser } = await ensureTaskOwner(ctx, { taskId });
		await _markAsDone(ctx, { taskId, isDone, author: currentUser._id });
	},
});

export const move = mutation({
	args: {
		taskId: zid('tasks'),
		newParentId: zid('tasks').optional(),
	},
	handler: async (ctx, { taskId, newParentId }) => {
		//
		const { task, currentUser } = await ensureTaskOwner(ctx, { taskId });

		if (newParentId) {
			// ensure we also have permission on the new parent
			await ensureTaskOwner(ctx, { taskId: newParentId });
		}

		if (task.parentId === newParentId) {
			throw new Error('Task is already in this list.');
		}

		await _move(ctx, { taskId, newParentId, author: currentUser._id });
	},
});

// Internal (no authorization) ------------------------------------

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

export const _add = internalMutation({
	args: {
		userId: zid('users'),
		body: z.optional(z.string()),
		parentId: zid('tasks').optional(),
	},
	handler: async (ctx, { userId, body, parentId }) => {
		//
		const taskId = await ctx.db.insert('tasks', { body, owner: userId, isDone: false, parentId });

		await _reportMutation(ctx, { taskId, changes: `Added this task with "${body}".`, author: userId });

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

		const tasks = await ctx.runQuery(internal.tasks._findAllByEmbeddingIds, {
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
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });

		if (!task.body) return;

		const { embedding, usage } = await embed({
			model: openai.embedding('text-embedding-3-large'),
			value: task.body,
		});

		console.log('embedding usage', usage);

		await ctx.runMutation(internal.tasks._addEmbedding, {
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
		const tasks = await ctx.runQuery(internal.tasks._findAllNotEmbedded);

		for (const task of tasks) {
			await ctx.runAction(internal.tasks._embedTask, { taskId: task._id });
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
		await ctx.db.patch(taskId, {
			...(title !== undefined && { title }),
			...(body !== undefined && { body }),
		});

		const updatedFields = [title !== undefined && 'title', body !== undefined && 'body'].filter(Boolean);

		const changes = updatedFields.length ? `Updated ${updatedFields.join(' and ')}.` : 'No fields were updated.';

		await _reportMutation(ctx, { taskId, changes, author });
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
		await ctx.db.patch(taskId, { isDone });

		const changes = isDone ? 'Marked as done.' : 'Marked as not done.';
		await _reportMutation(ctx, { taskId, changes, author });
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
		await ctx.db.patch(taskId, { parentId: newParentId });

		const changes = `Moved ${taskId} to ${newParentId || 'Inbox'}.`;
		await _reportMutation(ctx, { taskId, changes, author });

		// TODO: forbid adding to itself
		// TODO: report to parents as well, old and new
	},
});

// Helper functions ------------------------------------

export const ensureTaskOwner = async (ctx: QueryCtx | MutationCtx, args: { taskId: Id<'tasks'> }) => {
	//
	const currentUser = await getCurrentUser(ctx, {});
	const task = await ctx.db.get(args.taskId);

	if (!task) throw new Error('Task not found');
	if (task.owner !== currentUser._id) throw new Error('Task not found'); // purposefully do not mention authorization

	return { currentUser, task };
};
