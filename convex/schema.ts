import { authTables } from '@convex-dev/auth/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { actionSchema } from './schemas/actionSchema';
import { componentSchema } from './schemas/componentSchema';
import { taskEmbeddingsSchema, taskSchema } from './schemas/taskSchema';
import { toolSchema } from './schemas/toolSchema';

// prettier-ignore
export default defineSchema({

	...authTables,
	
	tasks: defineTable(
		zodToConvex(taskSchema),
	).index(
		'by_author_parentId_isDone', ['author', 'parentId', 'isDone'],
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
	
	actions: defineTable(
		zodToConvex(actionSchema),
	).index(
		'by_task', ['taskId'],
	).index(
		'by_task_status', ['taskId', 'status'],
	),

	tools: defineTable(
		zodToConvex(toolSchema),
	).index(
		'by_owner', ['owner'],
	).index(
		'by_key', ['key'],
	),

	// TODO: instructions
	// instructions: defineTable(
	// 	zodToConvex(instructionSchema),
	// ).index(
	// 	'by_owner', ['owner'],
	// )

	components: defineTable(
		zodToConvex(componentSchema),
	).index(
		'by_owner_slug', ['owner', 'slug'],
	),
});
