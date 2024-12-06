import { authTables } from '@convex-dev/auth/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { taskActionSchema } from './schemas/taskActionSchema';
import { taskEventSchema } from './schemas/taskEventSchema';
import { taskSchema } from './schemas/taskSchema';

// prettier-ignore
export default defineSchema({

	...authTables,

	tasks: defineTable(
		zodToConvex(taskSchema),
	).index(
		'by_owner_isDone', ['owner', 'isDone'],
	),

	taskEvents: defineTable(
		zodToConvex(taskEventSchema),
	).index(
		'by_task', ['taskId'],
	),

	taskActions: defineTable(
		zodToConvex(taskActionSchema),
	).index(
		'by_task', ['taskId'],
	).index(
		'by_task_status', ['taskId', 'status'],
	)
	// .index('by_origin', ['origin'])
	// .index('by_author', ['author']),
});
