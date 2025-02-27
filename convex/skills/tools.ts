import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';
import { skillSchema } from '../schemas/skillSchema';
import { _builtInSkills } from './builtIn';
import { createAITool } from './createAITool';
import { createBuiltInTool } from './createBuiltInTool';
import { createHTTPTool } from './createHttpTool';

export const _allSkillsAsTools = async (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
) => {
	//
	const skills = await ctx.runQuery(internal.skills.private._findAll, {
		owner: task.owner,
	});

	return {
		...toMap(skills, (skill) => createTool(ctx, task, action, skill)),
		..._builtInTools(ctx, task, action),
	};
};

export const _toolsForMagicRock = async (
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
) => {
	//
	const skills = await ctx.runQuery(internal.skills.private._findAll, {
		owner: task.owner,
		kind: 'hard',
	});

	const map = {
		...toMap(skills, (skill) => createTool(ctx, task, action, skill)),
		..._builtInTools(ctx, task, action, true),
	};

	Object.values(map).forEach((skill) => {
		// @ts-ignore TODO: workaround because I cannot stop AI SDK from calling execute()
		skill.execute = undefined;
	});

	return map;
};

export const _builtInTools = (
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	isForMagicRock: boolean = false, // TODO: this is a temporary solution. Skill selection should be done on the action.
) => {
	//

	return Object.keys(_builtInSkills).reduce(
		(acc, key) => {
			//
			const skill = _builtInSkills[key as keyof typeof _builtInSkills];

			if (isForMagicRock && !skill.isVisibleToMagicRock) return acc;

			acc[key] = createBuiltInTool(ctx, task, action, skill);

			return acc;
		},
		{} as Record<string, ReturnType<typeof createBuiltInTool>>,
	);
};

export function createTool(
	ctx: ActionCtx | MutationCtx, //
	task: Doc<'tasks'>,
	action: Doc<'actions'>,
	skill: z.infer<typeof skillSchema>,
) {
	//
	// prettier-ignore
	switch (skill.kind) {
		case 'hard': return createHTTPTool(ctx, task, action, skill);
		case 'soft': return createAITool(ctx, task, action, skill);
		case 'built-in': {
			//
			if (skill.key in _builtInSkills) {
				const builtInSkill = _builtInSkills[skill.key as keyof typeof _builtInSkills];
				return createBuiltInTool(ctx, task, action, builtInSkill);
			}

			throw new Error(`Unknown built-in skill: ${skill.key}`);
		}
	}
}

function toMap<SkillType extends { key: string }, ReturnType>(
	skills: Array<SkillType>, //
	mapFn: (skill: SkillType) => ReturnType,
) {
	return skills.reduce(
		(acc, skill) => {
			acc[skill.key] = mapFn(skill);
			return acc;
		},
		{} as Record<string, ReturnType>,
	);
}
