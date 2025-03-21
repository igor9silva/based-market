import { Doc, Id } from 'convex/_generated/dataModel';

import { GenericAction } from '~/components/actions/generic';
import { SayAction } from '~/components/actions/say';
import { SearchWebAction } from '~/components/actions/searchWeb';
import { UpdateInstructionsAction } from '~/components/actions/updateInstructions';

const componentMap = {
	say: SayAction,
	searchWeb: SearchWebAction,
	updateInstructions: UpdateInstructionsAction,
};

export function Action(props: {
	className?: string;
	action: Doc<'actions'>;
	initialRenderDate: Date;
	isAuthorCurrentUser: boolean;
	taskId: Id<'tasks'>;
}) {
	//
	if (props.action.skillKey in componentMap) {
		const Component = componentMap[props.action.skillKey as keyof typeof componentMap];
		return <Component {...props} />;
	}

	return <GenericAction {...props} />;
}
