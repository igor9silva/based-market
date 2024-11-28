import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './author';
import { taskActionKindSchema, taskActionStatusSchema } from './taskAction';

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

export const taskSchema = z.object({
	owner: zid('users'),
	title: z.string(),
	body: z.string().optional(),
	isDone: z.boolean(),
});

export const taskActionSchema = z.object({
	taskId: zid('tasks'),
	kind: taskActionKindSchema,
	status: taskActionStatusSchema,
	isDone: z.boolean(),
	errorMessage: z.string().optional(),
});
