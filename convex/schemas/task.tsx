import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const taskSchema = z.object({
	owner: zid('users'),
	title: z.string(),
	body: z.string().optional(),
	isDone: z.boolean(),
});
