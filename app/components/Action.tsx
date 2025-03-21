import { Doc, Id } from 'convex/_generated/dataModel';

import { GenericAction } from '~/components/actions/generic';
import { SayAction } from '~/components/actions/say';

const componentMap = {
	say: SayAction,
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
