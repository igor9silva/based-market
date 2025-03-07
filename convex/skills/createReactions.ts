import { Doc, Id } from '../_generated/dataModel';

export function createReactions(
	action: Doc<'actions'>,
	reactions?: Array<{
		skillKey: string;
		args: Record<string, any>;
		condition: 'owner' | 'companion' | 'any';
	}>,
) {
	return (reactions ?? [])
		.filter((reaction) => {
			// prettier-ignore
			switch (reaction.condition) {
				case 'owner': return action.owner === action.author;
				case 'companion': return action.owner !== action.author;
				case 'any': return true;
			}
		})
		.map((reaction) => ({
			skillKey: reaction.skillKey,
			args: reaction.args,
			taskId: action.taskId,
			owner: action.owner,
			author: action._id as Id<'actions'> | Id<'users'>, // I have no idea why I need that cast, as it expects a union of Id<'actions'> or Id<'users'>
		}));
}
