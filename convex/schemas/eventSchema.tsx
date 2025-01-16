import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

const coreEventSchema = z.object({
	taskId: zid('tasks'), // TODO: or action?
	author: authorSchema,
});

export const messageEventSchema = coreEventSchema.extend({
	kind: z.literal('message'),
	message: z.string().describe('The message content in MDX format.'),
});

export const toolCallEventSchema = coreEventSchema.extend({
	kind: z.literal('tool-call'),
	toolCallId: z.string(), // the one from the provider if comes from LLM, otherwise we generate one
	toolName: z.string(),
	args: z.record(z.any()),
	statusText: z.string().optional(), // can be optionally set by the LLM multiple times, will be rendered to the user
	result: z.string().optional(),
	isError: z.boolean().default(false),
});

export const eventSchema = z
	.union([
		messageEventSchema, //
		toolCallEventSchema,
	])
	.describe('An event is anything that happens on a Task. e.g. a message, a mutation, an operation.');
