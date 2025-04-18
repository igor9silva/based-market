import { zid } from 'convex-helpers/server/zod';
import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { mutation, query } from '../lib';
import { newSkillSchema } from '../schemas/skillSchema';
import { current as getCurrentUser } from '../users/public';
import { _create, _findAllByOwner, _update } from './private';

export const findAllPublic = query({
	handler: async (ctx) => {
		return await _findAllByOwner(ctx, { owner: 'isPro' });
	},
});

export const findAllPersonal = query({
	handler: async (ctx) => {
		const currentUser = await getCurrentUser(ctx, {});
		return await _findAllByOwner(ctx, { owner: currentUser._id });
	},
});

export const findOne = query({
	args: {
		skillId: zid('skills'),
	},
	handler: async (ctx, { skillId }) => {
		//
		const { skill } = await ensureSkillOwner(ctx, { skillId });

		return skill;
	},
});

export const availableIntelligences = query({
	handler: async (ctx) => {
		// TODO: make this list dynamic
		return {
			default: 'anthropic/claude-3.5-haiku',
			recommended: [
				{
					key: 'anthropic/claude-3.7-sonnet',
					name: 'Claude 3.7 Sonnet',
					provider: 'Anthropic',
					description: 'Best overall',
				},
				{
					key: 'anthropic/claude-3.5-haiku',
					name: 'Claude 3.5 Haiku',
					provider: 'Anthropic',
					description: 'Best value (recommended for most tasks)',
				},
				{
					key: 'groq/llama-4-maverick',
					name: 'Llama 4 Maverick',
					provider: 'Groq',
					description: 'Fastest and cheapest, but not that smart',
				},
			],
			all: [
				{
					key: 'google/gemini-2.5-pro',
					name: 'Gemini 2.5 Pro',
					provider: 'Google',
				},
				{
					key: 'google/gemini-2.0-flash',
					name: 'Gemini 2.0 Flash',
					provider: 'Google',
				},
				{
					key: 'google/gemini-2.0-flash-lite',
					name: 'Gemini 2.0 Flash Lite',
					provider: 'Google',
				},
				{
					key: 'openai/gpt-4.1',
					name: 'GPT-4.1',
					provider: 'OpenAI',
				},
				{
					key: 'openai/gpt-4.1-mini',
					name: 'GPT-4.1 Mini',
					provider: 'OpenAI',
				},
				{
					key: 'openai/gpt-4.1-nano',
					name: 'GPT-4.1 Nano',
					provider: 'OpenAI',
				},
				{
					key: 'xai/grok-3',
					name: 'Grok 3',
					provider: 'xAI',
				},
				{
					key: 'xai/grok-3-mini',
					name: 'Grok 3 Mini',
					provider: 'xAI',
				},
				{
					key: 'deepseek/deepseek-v3',
					name: 'DeepSeek V3',
					provider: 'DeepSeek',
				},
			],
		};
	},
});

export const create = mutation({
	args: {
		skill: newSkillSchema,
	},
	handler: async (ctx, { skill }) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await _create(ctx, { skill, userId: currentUser._id });
	},
});

export const update = mutation({
	args: {
		skillId: zid('skills'),
		updatedSkill: newSkillSchema,
	},
	handler: async (ctx, { skillId, updatedSkill }) => {
		//
		const { currentUser } = await ensureSkillOwner(ctx, { skillId });

		return await _update(ctx, { skillId, updatedSkill, userId: currentUser._id });
	},
});

export const ensureSkillOwner = async (
	ctx: QueryCtx | MutationCtx, //
	args: {
		skillId: Id<'skills'>;
	},
) => {
	//
	const currentUser = await getCurrentUser(ctx, {});
	const skill = await ctx.db.get(args.skillId);

	if (!skill) throw new Error('Skill not found');
	if (skill.owner !== currentUser._id) throw new Error('Skill not found'); // purposefully do not mention authorization

	return { currentUser, skill };
};
