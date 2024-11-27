import { authTables } from '@convex-dev/auth/server';
import { zid, zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { z } from 'zod';

// #region Global -------------------------------------
export const authorSchema = z.union([
	zid('users'), //
	z.literal('meseeks'),
]);
// #endregion

// #region Task Actions -------------------------------------
export const taskActionStatusSchema = z.enum([
	'pending', //
	'running',
	'succeeded',
	'failed',
	'skipped',
]);

export const taskActionKindSchema = z.enum([
	'fill', //
	'minify',
	'scrape',
	'factCheck',
	// 'learn',
	// 'suggest',
]);
// #endregion

// #region Task Events -------------------------------------
export const actionResultErrorTaskEventSchema = z.object({
	kind: z.literal('actionResult'),
	taskId: zid('tasks'),
	author: authorSchema,
	actionId: zid('taskActions'),
	actionKind: taskActionKindSchema,
	error: z.string(),
	result: z.null(),
});

export const actionResultSuccessTaskEventSchema = z.object({
	kind: z.literal('actionResult'),
	taskId: zid('tasks'),
	author: authorSchema,
	actionId: zid('taskActions'),
	actionKind: taskActionKindSchema,
	result: z.string(),
	error: z.null(),
});

export const actionRequestTaskEventSchema = z.object({
	kind: z.literal('actionRequest'),
	taskId: zid('tasks'),
	author: authorSchema,
	actionId: zid('taskActions'),
	actionKind: taskActionKindSchema,
});

export const messageTaskEventSchema = z.object({
	kind: z.literal('message'),
	taskId: zid('tasks'),
	author: authorSchema,
	message: z.string(),
});

export const addTaskEventSchema = z.object({
	kind: z.literal('add'),
	taskId: zid('tasks'),
	author: authorSchema,
});

export const updateTaskEventSchema = z.object({
	kind: z.literal('update'),
	taskId: zid('tasks'),
	author: authorSchema,
	changes: z.string(),
});

export const markAsDoneTaskEventSchema = z.object({
	kind: z.literal('markAsDone'),
	taskId: zid('tasks'),
	author: authorSchema,
	isDone: z.boolean(),
});

export const taskEventSchema = z.union([
	actionRequestTaskEventSchema,
	actionResultErrorTaskEventSchema,
	actionResultSuccessTaskEventSchema,
	messageTaskEventSchema,
	addTaskEventSchema,
	updateTaskEventSchema,
	markAsDoneTaskEventSchema,
]);
// #endregion

// Schema for tasks table
export const taskSchema = z.object({
	owner: zid('users'),
	title: z.string(),
	body: z.string().optional(),
	isDone: z.boolean(),
});

// Schema for taskActions table
export const taskActionSchema = z.object({
	taskId: zid('tasks'),
	kind: taskActionKindSchema,
	status: taskActionStatusSchema,
	isDone: z.boolean(),
	errorMessage: z.string().optional(),
});

// Define the schema using Zod schemas converted to Convex validators
export default defineSchema({
	...authTables,
	tasks: defineTable(
		zodToConvex(taskSchema), //
	).index(
		'by_owner_isDone', //
		['owner', 'isDone'],
	),
	taskActions: defineTable(
		zodToConvex(taskActionSchema), //
	).index(
		'by_task', //
		['taskId'],
	),
	taskEvents: defineTable(
		zodToConvex(taskEventSchema), //
	).index(
		'by_task', //
		['taskId'],
	),
});
