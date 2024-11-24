import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

// #region Global -------------------------------------
export const authorSchema = v.union(
	v.id('users'), //
	v.literal('meseeks'),
);
// #endregion

// #region Task Actions -------------------------------------
export const taskActionStatuses = v.union(
	v.literal('pending'),
	v.literal('running'),
	v.literal('succeeded'),
	v.literal('failed'),
	v.literal('skipped'),
);

export const taskActionKinds = v.union(
	v.literal('fill'),
	v.literal('minify'),
	v.literal('scrape'),
	v.literal('factCheck'),
	// v.literal('learn'),
	// v.literal('suggest'),
);
// #endregion

// #region Task Events -------------------------------------
export const actionResultErrorTaskEventSchema = v.object({
	kind: v.literal('actionResult'),
	taskId: v.id('tasks'),
	author: authorSchema,
	actionId: v.id('taskActions'),
	actionKind: taskActionKinds,
	error: v.string(),
	result: v.null(),
});

export const actionResultSuccessTaskEventSchema = v.object({
	kind: v.literal('actionResult'),
	taskId: v.id('tasks'),
	author: authorSchema,
	actionId: v.id('taskActions'),
	actionKind: taskActionKinds,
	result: v.string(),
	error: v.null(),
});

export const actionRequestTaskEventSchema = v.object({
	kind: v.literal('actionRequest'),
	taskId: v.id('tasks'),
	author: authorSchema,
	actionId: v.id('taskActions'),
	actionKind: taskActionKinds,
});

export const messageTaskEventSchema = v.object({
	kind: v.literal('message'),
	taskId: v.id('tasks'),
	author: authorSchema,
	message: v.string(),
});

export const addTaskEventSchema = v.object({
	kind: v.literal('add'),
	taskId: v.id('tasks'),
	author: authorSchema,
});

export const updateTaskEventSchema = v.object({
	kind: v.literal('update'),
	taskId: v.id('tasks'),
	author: authorSchema,
	changes: v.string(),
});

export const taskEventSchema = v.union(
	actionRequestTaskEventSchema,
	actionResultErrorTaskEventSchema,
	actionResultSuccessTaskEventSchema,
	messageTaskEventSchema,
	addTaskEventSchema,
	updateTaskEventSchema,
);
// #endregion

export default defineSchema({
	...authTables,
	tasks: defineTable({
		owner: v.id('users'),
		title: v.string(),
		body: v.optional(v.string()),
	}).index('by_owner', ['owner']),
	taskActions: defineTable({
		taskId: v.id('tasks'),
		kind: taskActionKinds,
		status: taskActionStatuses,
		isDone: v.boolean(),
		errorMessage: v.optional(v.string()),
	}).index('by_task', ['taskId']),
	taskEvents: defineTable(
		taskEventSchema, //
	).index('by_task', ['taskId']),
});
