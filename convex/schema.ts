import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

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

const author = v.union(
	v.id('users'), //
	v.literal('meseeks'),
);

export const actionResultErrorTaskEventSchema = v.object({
	taskId: v.id('tasks'),
	author: author,
	actionId: v.id('taskActions'),
	kind: v.literal('actionResult'),
	error: v.string(),
});

export const actionResultSuccessTaskEventSchema = v.object({
	taskId: v.id('tasks'),
	author: author,
	actionId: v.id('taskActions'),
	kind: v.literal('actionResult'),
	result: v.string(),
});

export const messageTaskEventSchema = v.object({
	taskId: v.id('tasks'),
	author: author,
	kind: v.literal('message'),
	message: v.string(),
});

export const actionRequestTaskEventSchema = v.object({
	taskId: v.id('tasks'),
	author: author,
	kind: v.literal('actionRequest'),
	action: taskActionKinds,
});

export const taskEventSchema = v.union(
	actionRequestTaskEventSchema,
	actionResultErrorTaskEventSchema,
	actionResultSuccessTaskEventSchema,
	messageTaskEventSchema,
);

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
