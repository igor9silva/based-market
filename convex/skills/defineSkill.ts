import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx, MutationCtx } from '../_generated/server';

export type Skill<T extends z.AnyZodObject> = {
	preApprovedCost: bigint | 'none';
	description: string;
	parameters: T;
	knownReactions: Array<Reaction>;
	use: (execution: ToolExecution) => (args: z.infer<T>) => Promise<ExecutionResult>;
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

// for the types
export const defineSkill = <T extends z.AnyZodObject>(skill: Skill<T>) => skill;
