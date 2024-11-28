import { authTables } from '@convex-dev/auth/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { taskSchema } from './schemas/task';
import { taskActionSchema } from './schemas/taskAction';

export default defineSchema({
	//
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
});
