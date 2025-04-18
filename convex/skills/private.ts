import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internalMutation, internalQuery } from '../lib';
import { builtInSkillSchema, newSkillSchema, skillOwnerSchema } from '../schemas/skillSchema';
import { zodToString } from '../utils/zodToString';
import { _builtInSkills } from './builtIn/index';

// all global skills + all user-defined skills
export const _findAll = internalQuery({
	args: {
		owner: zid('users'),
		kind: z
			.enum([
				'hard', //
				'soft',
			])
			.optional()
			.describe('Filter by skill kind. Grab all if unspecified.'),
	},
	handler: async (ctx, { owner, kind }) => {
		//
		const [globals, users] = await Promise.all([
			_findAllByOwner(ctx, { owner: 'isPro', kind }), // global skills
			_findAllByOwner(ctx, { owner, kind }), // user-defined skills
		]);

		return globals.concat(users);
	},
});

export const _findAllByOwner = internalQuery({
	args: {
		owner: skillOwnerSchema,
		kind: z
			.enum([
				'hard', //
				'soft',
			])
			.optional()
			.describe('Filter by skill kind. Grab all if unspecified.'),
	},
	handler: async (ctx, { owner, kind }) => {
		//
		return await ctx.db
			.query('skills')
			.withIndex('by_owner_kind', (q) =>
				kind
					? q.eq('owner', owner).eq('kind', kind) //
					: q.eq('owner', owner),
			)
			.collect();
	},
});

export const _findOne = internalQuery({
	args: {
		key: z.string(),
		owner: zid('users'),
	},
	handler: async (ctx, { key, owner }) => {
		//
		const globalSkill = await _findOneByOwner(ctx, { key, owner: 'isPro' });
		if (globalSkill) return globalSkill;

		const userSkill = await _findOneByOwner(ctx, { key, owner });
		if (userSkill) return userSkill;

		if (key in _builtInSkills) {
			//
			const builtInTool = _builtInSkills[key as keyof typeof _builtInSkills];

			return builtInSkillSchema.parse({
				key,
				description: builtInTool.description,
				inputSchema: zodToString(builtInTool.parameters),
				preApprovedCost: builtInTool.preApprovedCost,
				kind: 'built-in',
				owner: 'built-in',
				author: 'built-in',
				cost: 0n,
			});
		}

		throw new Error(`Unknown skill: ${key}`);
	},
});

const _findById = internalQuery({
	args: {
		skillId: zid('skills'),
	},
	handler: async (ctx, { skillId }) => {
		return await ctx.db.get(skillId);
	},
});

export const _findOneByOwner = internalQuery({
	args: {
		key: z.string(),
		owner: skillOwnerSchema,
	},
	handler: async (ctx, { key, owner }) => {
		return await ctx.db
			.query('skills')
			.withIndex('by_owner_key', (q) => q.eq('owner', owner).eq('key', key))
			.unique();
	},
});

export const _create = internalMutation({
	args: {
		skill: newSkillSchema,
		userId: zid('users'),
	},
	handler: async (ctx, { skill, userId }) => {
		//
		const existing = await _findOne(ctx, { key: skill.key, owner: userId });
		if (existing) throw new Error(`Skill key '${skill.key}' in use.`);

		return await ctx.db.insert('skills', {
			...skill,
			owner: userId,
			author: userId,
		});
	},
});

export const _update = internalMutation({
	args: {
		skillId: zid('skills'),
		updatedSkill: newSkillSchema,
		userId: zid('users'),
	},
	handler: async (ctx, { skillId, updatedSkill, userId }) => {
		//
		const existing = await _findById(ctx, { skillId });

		if (!existing) throw new Error('Skill not found');
		if (existing.owner !== userId) throw new Error('Skill not found');
		if (existing.key !== updatedSkill.key) throw new Error('Skill key cannot be changed.');

		return await ctx.db.patch(skillId, {
			...updatedSkill,
		});
	},
});
