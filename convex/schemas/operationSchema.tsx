import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

export const operationStatusSchema = z.enum([
	// 'awaiting approval', // TODO: add
	'pending', //
	'running',
	'succeeded',
	'failed',
	'skipped',
]);

export const operationKindSchema = z.enum([
	'think', //
	'run-tool',
]);

export const coreOperationSchema = z.object({
	origin: zid('events'),
	author: authorSchema,
	taskId: zid('tasks'),
	status: operationStatusSchema,
	isDone: z.boolean(),
});

export const thinkOperationSchema = coreOperationSchema.extend({
	kind: z.literal('think'),
});

export const runToolOperationSchema = coreOperationSchema.extend({
	kind: z.literal('run-tool'),
	toolName: z.string(),
	args: z.record(z.any()),
});

export const operationSchema = z
	.union([
		thinkOperationSchema, //
		runToolOperationSchema,
	])
	.describe('An operation is the execution of an Action. `Think` is just an Action, but a very special one.');
