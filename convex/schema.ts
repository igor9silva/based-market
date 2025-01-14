import { authTables } from '@convex-dev/auth/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { actionSchema } from './schemas/actionSchema';
import { componentSchema } from './schemas/componentSchema';
import { eventSchema } from './schemas/eventSchema';
import { operationSchema } from './schemas/operationSchema';
import { taskEmbeddingsSchema, taskSchema } from './schemas/taskSchema';

// prettier-ignore
export default defineSchema({

	...authTables,
	
	tasks: defineTable(
		zodToConvex(taskSchema),
	).index(
		'by_owner_parentId_isDone', ['owner', 'parentId', 'isDone'],
	).index(
		'by_parent_isDone', ['parentId', 'isDone'],
	).index(
		'by_embeddingId', ['embeddingId'],
	),

	taskEmbeddings: defineTable(
		zodToConvex(taskEmbeddingsSchema),
	).vectorIndex("by_embedding", {
		dimensions: 3072,
		vectorField: 'embedding',
		filterFields: ['isDone'],
	}),

	// built-in mutations, http calls, AI SDK calls (including multi-step)
	actions: defineTable(
		zodToConvex(actionSchema),
	).index(
		'by_owner', ['owner'],
	).index(
		'by_name', ['name'],
	),

	events: defineTable(
		zodToConvex(eventSchema),
	).index(
		'by_task', ['taskId'],
	),

	operations: defineTable(
		zodToConvex(operationSchema),
	).index(
		'by_task', ['taskId'],
	).index(
		'by_task_status', ['taskId', 'status'],
	),
	// .index('by_origin', ['origin'])
	// .index('by_author', ['author']),

	components: defineTable(
		zodToConvex(componentSchema),
	).index(
		'by_owner_slug', ['owner', 'slug'],
	),
});
