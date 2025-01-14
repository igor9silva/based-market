import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const componentSchema = z.object({
	owner: zid('users'),
	body: z.string().describe('MDX'),
	defaultTaskId: zid('tasks').optional(),
	slug: z
		.string()
		.optional()
		.describe(
			'The slug of the component, used to identify it in the URL. If undefined, the component cannot be accessed directly via URL.',
		),
});
