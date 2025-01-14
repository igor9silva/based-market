import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const taskSchema = z
	.object({
		owner: zid('users'),
		title: z.string().optional(),
		body: z.string().optional(),
		parentId: zid('tasks').optional(),
		isDone: z.boolean(),
		embeddingId: zid('taskEmbeddings').optional(),
	})
	.describe(`It's a goal to be achieved. A Task is the basic and most fundamental entity of Meseeks.`);

export const taskEmbeddingsSchema = z.object({
	taskId: zid('tasks'),
	embedding: z.array(z.number()),
	isDone: z.boolean(),
});
