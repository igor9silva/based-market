import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

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

export const taskActionSchema = z.object({
	taskId: zid('tasks'),
	kind: taskActionKindSchema,
	status: taskActionStatusSchema,
	isDone: z.boolean(),
	errorMessage: z.string().optional(),
});
