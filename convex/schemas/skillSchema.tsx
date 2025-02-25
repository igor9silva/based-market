import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { asBigInt } from '../utils/money';
import { authorSchema } from './authorSchema';

export const skillOwnerSchema = z.union([
	z.literal('built-in'), // built-in to Meseeks
	z.literal('isPro'), // managed by us, offered by third-parties
	zid('users'), // managed by users
]);

export const skillAuthorSchema = z.union([
	authorSchema, // user or meseeks-defined skills
	z.literal('built-in'), // global skills
]);

export const skillKindSchema = z.enum([
	'built-in', //
	'hard',
	'soft',
]);

// TODO: idea: the initial seed is just an action that happens on the onboarding task

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
	parametersSchema: z.string(), // TODO: enforce that this is a valid zod schema
	preApprovedCost: z.union([
		z.literal('none'),
		z
			.bigint()
			.min(asBigInt({ dollars: 0 }))
			.max(asBigInt({ dollars: 1000 }))
			.describe(
				'If the expected cost is less than or equal to this amount (pre-approved cost), it will be automatically authorized to execute. If can be set to "none" to disable pre-approval at all, forcing a human-approval before execution.',
			),
	]),
	kind: skillKindSchema,
	owner: skillOwnerSchema,
	author: skillAuthorSchema,
});

export const builtInSkillSchema = coreSkillSchema.extend({
	kind: z.literal('built-in'),
	owner: z.literal('built-in'),
	author: z.literal('built-in'),
	cost: z.literal(0n).describe('Built-in skills are free of charge.'),
});

export const hardSkillSchema = coreSkillSchema.extend({
	kind: z.literal('hard'),
	cost: z
		.bigint() //
		.min(asBigInt({ dollars: 0 }))
		.max(asBigInt({ dollars: 1000 }))
		.describe('The cost to use this skill, in USD.'),
	config: httpConfigSchema,
});

export const softSkillSchema = coreSkillSchema.extend({
	kind: z.literal('soft'),
	cost: z
		.literal('dynamic')
		.describe(
			'The cost to use this skill, in USD. Dynamic cost means it will be known during usage. Budget is still accounted before execution.',
		),
	config: decisionConfigSchema,
});

export const skillSchema = z
	.union([
		builtInSkillSchema, //
		hardSkillSchema,
		softSkillSchema,
	])
	.describe(
		'A Skill is an external API call (service or LLM) that can be used by the user or Meseeks.', //
	);

// Instincts/built-in skills
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
