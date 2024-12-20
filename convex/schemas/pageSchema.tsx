import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const pageSchema = z.object({
	owner: zid('users'),
	body: z.string().describe('MDX'),
	defaultTaskId: zid('tasks').optional(),
	slug: z.string(),
});
