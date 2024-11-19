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

export const taskActionKinds = v.union(
	v.literal('fill'),
	v.literal('minify'),
	v.literal('scrape'),
	v.literal('factCheck'),
	// v.literal('learn'),
	// v.literal('suggest'),
);

export default defineSchema({
	...authTables,
	tasks: defineTable({
		owner: v.id('users'),
		title: v.string(),
		body: v.optional(v.string()),
	}).index('by_owner', ['owner']),
	taskActions: defineTable({
		taskId: v.id('tasks'),
		kind: taskActionKinds,
		status: taskActionStatuses,
		isDone: v.boolean(),
	}).index('by_task', ['taskId']),
});
