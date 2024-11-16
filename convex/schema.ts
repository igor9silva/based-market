import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const taskActionStatuses = v.union(
	v.literal('pending'),
	v.literal('running'),
	v.literal('succeeded'),
	v.literal('failed'),
	v.literal('cancelled'),
);

export default defineSchema({
	...authTables,
	tasks: defineTable({
		owner: v.id('users'),
		title: v.string(),
		body: v.optional(v.string()),
	}),
	taskActions: defineTable({
		owner: v.id('users'),
		taskId: v.id('tasks'),
		kind: v.union(
			v.literal('fill'), //
			v.literal('reduce'),
			// v.literal('learn'),
			// v.literal('suggest'),
		),
		status: taskActionStatuses,
		isDone: v.boolean(),
	}).index('by_task', ['taskId']),
});
