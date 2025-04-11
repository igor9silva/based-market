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

export const modelsSchema = z.enum([
	'anthropic/claude-3.7-sonnet',
	'anthropic/claude-3.5-haiku',
	'openai/gpt-4o',
	'openai/gpt-4o-mini',
	'google/gemini-2.0-flash',
	'deepseek/v3',
	'deepinfra/deepseek-v3',
	'together/llama-4-maverick',
	'groq/llama-4-scout',
	'groq/llama-4-maverick',
]);

const decisionConfigSchema = z.object({
	model: modelsSchema,
	instructions: z.string().describe('Instructions for the decision-making process'),
	temperature: z.number().min(0).max(2).describe('Temperature to use'),
	availableSkills: z.array(z.string()).describe('Skills that can be used to make the decision'),
	historyMode: z.enum([
		// 'none', //
		'since last summarized',
		'since last instructed',
		'all',
	]),
	topP: z
		.number()
		.min(0)
		.max(1)
		.optional()
		.describe(
			'Nucleus sampling. This is a number between 0 and 1. E.g. 0.1 would mean that only tokens with the top 10% probability mass are considered. It is recommended to set either `temperature` or `topP`, but not both.',
		),
	topK: z
		.number()
		.optional()
		.describe(
			'Only sample from the top K options for each subsequent token. Only sample from the top K options for each subsequent token. Used to remove "long tail" low probability responses. Recommended for advanced use cases only. Usually `temperature` is enough.',
		),
	maxTokens: z
		.number() //
		.optional()
		.describe('Maximum number of tokens to use'),
	maxRetries: z
		.number()
		.optional()
		.describe('Maximum number of (AI SDK internal) retries. Set to 0 to disable retries.'),
	frequencyPenalty: z
		.number()
		.min(-1)
		.max(1)
		.optional()
		.describe(
			`Affects the likelihood of the model to repeatedly use the same words or phrases. Is a number between -1 (increase repetition) and 1 (maximum penalty, decrease repetition). 0 means no penalty.`,
		),
	stopSequences: z
		.array(z.string())
		.optional()
		.describe(
			'If set, the model will stop generating text when one of the stop sequences is generated. Providers may have limits on the number of stop sequences.',
		),
	seed: z
		.number()
		.optional()
		.describe(
			'The seed (integer) to use for random sampling. If set and supported by the model, calls will generate deterministic results.',
		),
});

const coreSkillSchema = z.object({
	key: z.string(),
	description: z.string(),
	inputSchema: z.string(), // TODO: enforce that this is a valid zod schema
	// outputSchema?: z.string(), // not yet
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
	knownReactions: z
		.array(
			z.object({
				skillKey: z.string().describe('The key of the skill to use'),
				args: z.record(z.any()),
				condition: z.enum([
					'owner', // only react if the author is the owner
					'companion', // only react if the author is a an action (i.e. companion did it)
					'any', // always react
				]),
			}),
		)
		.optional()
		.describe('Pre-configured actions that will happen as a re-action to the use of this skill.'),
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
		.describe('The cost to use this skill, in USDC.'),
	config: httpConfigSchema,
});

export const softSkillSchema = coreSkillSchema.extend({
	kind: z.literal('soft'),
	cost: z
		.literal('dynamic')
		.describe(
			'The cost to use this skill, in USDC. Dynamic cost means it will be known during usage. Budget is still accounted before execution.',
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
