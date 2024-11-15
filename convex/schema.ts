import { authTables } from '@convex-dev/auth/server';
import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
	...authTables,
	tasks: defineTable({
		title: v.string(),
		body: v.optional(v.string()),
		owner: v.id('users'),
		effects: v.optional(v.array(v.string())),
	}),
});
