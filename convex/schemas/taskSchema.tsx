import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

export const taskSchema = z
	.object({
		author: authorSchema.describe('Who created the task.'),
		owner: zid('users').describe('The user who is responsible for the task.'),
		title: z.string().max(100).optional().describe('A short title for the task. Max 100 characters.'),
		details: z.string().optional().describe('An MDX detailed description of the task.'),
		lastSummarizedAt: z.number().optional().describe('The last time the task was summarized.'),
		resolution: z
			.string()
			.optional()
			.describe('How was the task resolved, in MDX. If filled but task is not yet done, its a draft resolution.'),
		parentId: zid('tasks').optional().describe('The parent task ID of this task.'),
		availableBudgetUSD: z
			.bigint()
			.describe('The remaining/available amount of money available to spend on this task.'),
		isDone: z
			.boolean()
			.describe('Whether the task has been resolved. If done but not resolution, its considered archived.'),
		embeddingId: zid('taskEmbeddings').optional(),
	})
	.describe(`It's a goal to be achieved. A Task is the basic and most fundamental entity of Meseeks.`);

export const taskEmbeddingsSchema = z.object({
	taskId: zid('tasks'),
	embedding: z.array(z.number()),
	isDone: z.boolean(),
});
