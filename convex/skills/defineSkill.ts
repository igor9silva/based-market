import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';

export type Skill<T extends z.AnyZodObject> = {
	isVisibleToMagicRock?: boolean;
	preApprovedCost: bigint | 'none';
	description: string;
	parameters: T;
	reactions: Array<Reaction>;
	execute: (execution: ToolExecution) => (args: z.infer<T>) => Promise<ExecutionResult>;
};

export type ToolExecution = {
	ctx: ActionCtx | MutationCtx; //
	task: Doc<'tasks'>;
	action: Doc<'actions'>;
	skill: Skill<z.AnyZodObject>;
};

export type Reaction = {
	skillKey: string;
	args: Record<string, any>;
	condition: 'owner' | 'companion' | 'any';
};

export type ExecutionResult = {
	result: string;
	reactions: Array<Reaction>;
};

export const defineSkill = <T extends z.AnyZodObject>(skill: Skill<T>) => ({
	// TODO: this is a temporary solution. Skill selection should be done on the action.
	...skill,
	isVisibleToMagicRock: skill.isVisibleToMagicRock === undefined ? true : skill.isVisibleToMagicRock,
});
