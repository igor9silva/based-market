import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

export const taskActionStatusSchema = z.enum([
	'pending', //
	'running',
	'succeeded',
	'failed',
	'skipped',
]);

export const taskActionKindSchema = z.enum([
	'think', //
	'run-tool',
]);

export const coreActionSchema = z.object({
	origin: zid('taskEvents'),
	author: authorSchema,
	taskId: zid('tasks'),
	status: taskActionStatusSchema,
	isDone: z.boolean(),
});

export const thinkActionSchema = coreActionSchema.extend({
	kind: z.literal('think'),
});

export const runToolActionSchema = coreActionSchema.extend({
	kind: z.literal('run-tool'),
	toolName: z.string(),
	args: z.record(z.any()),
});

export const taskActionSchema = z.union([
	thinkActionSchema, //
	runToolActionSchema,
]);
