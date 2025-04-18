import { Doc, Id } from 'convex/_generated/dataModel';

import { SimpleMessage } from '~/components/ui/message';

export function DoneAction({
	className, //
	action,
	initialRenderDate,
	isAuthorCurrentUser,
	taskId,
}: {
	className?: string;
	action: Doc<'actions'>;
	initialRenderDate: Date;
	isAuthorCurrentUser: boolean;
	taskId: Id<'tasks'>;
}) {
	// const isNew = useIsNew(action._creationTime, initialRenderDate);

	return <SimpleMessage text={`☑︎ ${action.args['message']}`} isAuthorCurrentUser={isAuthorCurrentUser} />;
}
