import { Id } from './_generated/dataModel';
import { mutation, query } from './_generated/server.js';

type AddArgs = {
	title: string;
	body: string | undefined;
	owner: Id<'users'>;
};

type FindOneArgs = {
	taskId: Id<'tasks'>;
};

type UpdateArgs = {
	taskId: Id<'tasks'>;
	title: string;
	body: string;
};

// TODO: from user (authorization)

export const list = query(async (ctx) => {
	return await ctx.db.query('tasks').collect();
});

export const add = mutation((ctx, { title, body, owner }: AddArgs) => {
	return ctx.db.insert('tasks', { title, body, owner });

	// TODO: auto-schedule actions
	// - fill
	// - learn
	// = suggest
	// - ...
});

export const findOne = query(async (ctx, { taskId }: FindOneArgs) => {
	//
	const task = await ctx.db.get(taskId);
	if (!task) throw new Error('Task not found');

	return task;
});

export const update = mutation((ctx, { taskId, title, body }: UpdateArgs) => {
	return ctx.db.patch(taskId, { title, body });
});
