import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { authorSchema } from './authorSchema';

export const skillOwnerSchema = z.union([
	z.literal('built-in'), // built-in to Meseeks
	z.literal('isPro'), // managed by us, offered by third-parties
	zid('users'), // managed by users
]);

export const skillAuthorSchema = z.union([
	authorSchema, // user or meseeks-defined skills
	z.literal('built-in'), // global skills // TODO: idea: the initial seed is just an action that happens on the onboarding task
]);

const httpConfigSchema = z.object({
	url: z.string().url(),
	method: z.enum([
		'GET', //
		'POST',
		'PUT',
		'DELETE',
		'PATCH',
	]),
	headers: z.record(z.string()).describe('HTTP headers to send with the request'),
	paramMappings: z.array(
		z.object({
			type: z.enum([
				'search', //
				'header',
				'path',
				'body',
			]),
			source: z.string().describe('original parameter name'),
			target: z.string().describe('name on the URL, header, path, or body'),
		}),
	),
	body: z
		.object({
			template: z.record(z.any()).describe('Base JSON object with pre-filled values'),
		})
		.optional(),
});

const decisionConfigSchema = z.object({
	// TODO: based on AI SDK types
	// model: z.string().describe('LLM model to use'),
	// temperature: z.number().describe('Temperature to use'),
	// maxSteps: z.number().describe('Maximum number of steps to take'),
	instructions: z.string().describe('Instructions for the decision-making process'),
});

const coreSkillSchema = z.object({
	key: z.string(),
	description: z.string(),
	owner: skillOwnerSchema,
	author: skillAuthorSchema,
	parametersSchema: z.string(), // TODO: enforce that this is a valid zod schema
});

export const httpSkillSchema = coreSkillSchema.extend({
	kind: z.literal('http'),
	config: httpConfigSchema,
});

export const decisionSkillSchema = coreSkillSchema.extend({
	kind: z.literal('decision'),
	config: decisionConfigSchema,
});

export const skillSchema = z
	.union([
		httpSkillSchema, //
		decisionSkillSchema,
	])
	.describe(
		'A Skill is an external API call (service or LLM) that can be used by the user or Meseeks.', //
	);

// // built-in skills
// speak()
// createTask()
// markAsDone()
// ...

// // managed by us, offered by third-parties
// react()
// learn()
// searchWeb()
// scrapeTweet()
// ...

// // managed by you
// ...
