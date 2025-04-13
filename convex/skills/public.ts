import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { Id } from '../_generated/dataModel';
import { MutationCtx, QueryCtx } from '../_generated/server';
import { query } from '../lib';
import { current as getCurrentUser } from '../users/public';
import { _findAll } from './private';

export const findAll = query({
	args: {
		kind: z
			.enum([
				'hard', //
				'soft',
			])
			.optional()
			.describe('Filter by skill kind. Grab all if unspecified.'),
	},
	handler: async (ctx, args) => {
		//
		const currentUser = await getCurrentUser(ctx, {});

		return await _findAll(ctx, { owner: currentUser._id, kind: args.kind });
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

// export const create = mutation({
// 	args: {
// 		key: z.string(),
// 		kind: z.enum(['hard', 'soft']),
// 		description: z.string(),
// 		inputSchema: z.string(),
// 		preApprovedCost: z.union([z.literal('none'), z.bigint()]),
// 		cost: z.union([z.bigint(), z.literal('dynamic')]),
// 		config: z.record(z.any()),
// 	},
// 	handler: async (ctx, args) => {
// 		//
// 		const currentUser = await getCurrentUser(ctx, {});

// 		// Check if a skill with this key already exists
// 		const existingSkill = await ctx.db
// 			.query('skills')
// 			.withIndex('by_owner_key', (q) => q.eq('owner', currentUser._id).eq('key', args.key))
// 			.unique();

// 		if (existingSkill) {
// 			throw new Error(`A skill with key '${args.key}' already exists`);
// 		}

// 		// Create the skill
// 		const { kind, cost, config, ...rest } = args;

// 		// Handle different skill types with appropriate schema validation
// 		if (kind === 'soft') {
// 			// For soft skills, validate against the decision config schema
// 			const validatedConfig = decisionConfigSchema.parse(config);

// 			return await ctx.db.insert('skills', {
// 				...rest,
// 				kind: 'soft',
// 				cost: 'dynamic',
// 				owner: currentUser._id,
// 				author: currentUser._id,
// 				config: validatedConfig,
// 			});
// 		} else {
// 			// For hard skills, validate against the HTTP config schema
// 			const validatedConfig = httpConfigSchema.parse(config);

// 			return await ctx.db.insert('skills', {
// 				...rest,
// 				kind: 'hard',
// 				cost: typeof cost === 'string' ? 0n : cost,
// 				owner: currentUser._id,
// 				author: currentUser._id,
// 				config: validatedConfig,
// 			});
// 		}
// 	},
// });

// export const update = mutation({
// 	args: {
// 		id: zid('skills'),
// 		key: z.string(),
// 		kind: z.enum(['hard', 'soft']),
// 		description: z.string(),
// 		inputSchema: z.string(),
// 		preApprovedCost: z.union([z.literal('none'), z.bigint()]),
// 		cost: z.union([z.bigint(), z.literal('dynamic')]),
// 		config: z.record(z.any()),
// 	},
// 	handler: async (ctx, { id, kind, cost, config, ...updates }) => {
// 		//
// 		const currentUser = await getCurrentUser(ctx, {});

// 		// Get the skill
// 		const skill = await ctx.db.get(id);
// 		if (!skill) throw new Error('Skill not found');

// 		// Check if user owns this skill
// 		if (skill.owner !== currentUser._id) {
// 			throw new Error('Skill not found');
// 		}

// 		// Ensure we don't change the kind
// 		if (skill.kind !== kind) {
// 			throw new Error(`Cannot change skill kind from ${skill.kind} to ${kind}`);
// 		}

// 		// Validate and update the skill with appropriate config schema
// 		if (kind === 'soft') {
// 			// For soft skills, validate against the decision config schema
// 			const validatedConfig = decisionConfigSchema.parse(config);

// 			await ctx.db.patch(id, {
// 				...updates,
// 				cost: 'dynamic',
// 				config: validatedConfig,
// 			});
// 		} else {
// 			// For hard skills, validate against the HTTP config schema
// 			const validatedConfig = httpConfigSchema.parse(config);

// 			await ctx.db.patch(id, {
// 				...updates,
// 				cost: typeof cost === 'string' ? 0n : cost,
// 				config: validatedConfig,
// 			});
// 		}

// 		return id;
// 	},
// });

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
