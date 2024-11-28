import { authTables } from '@convex-dev/auth/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { taskActionSchema, taskEventSchema, taskSchema } from './schemas/taskEvent';

// Define the schema using Zod schemas converted to Convex validators
export default defineSchema({
	...authTables,
	tasks: defineTable(
		zodToConvex(taskSchema), //
	).index(
		'by_owner_isDone', //
		['owner', 'isDone'],
	),
	taskActions: defineTable(
		zodToConvex(taskActionSchema), //
	).index(
		'by_task', //
		['taskId'],
	),
	taskEvents: defineTable(
		zodToConvex(taskEventSchema), //
	).index(
		'by_task', //
		['taskId'],
	),
});
