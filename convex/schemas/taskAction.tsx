import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './author';

export const taskActionStatusSchema = z.enum([
	'pending', //
	'running',
	'succeeded',
	'failed',
	'skipped',
]);

export const taskActionKindSchema = z.enum([
	'message', //
	'mutation',
]);

export const coreActionSchema = z.object({
	taskId: zid('tasks'),
	author: authorSchema,
	status: taskActionStatusSchema,
	isDone: z.boolean(),
});

export const messageActionSchema = coreActionSchema.extend({
	kind: z.literal('message'),
	message: z.string(),
});

export const mutationActionSchema = coreActionSchema.extend({
	kind: z.literal('mutation'),
	changes: z.string(),
});

export const taskActionSchema = z.discriminatedUnion('kind', [
	messageActionSchema, //
	mutationActionSchema,
]);
