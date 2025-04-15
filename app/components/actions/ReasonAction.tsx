import { Doc, Id } from 'convex/_generated/dataModel';

import { Message, MessageContent } from '~/components/ui/message';

export function ReasonAction({
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

	if (action.status !== 'succeeded') return null;
	if (!action.result.text) console.warn('succeeded reason action with no text', action);

	return (
		<Message isAuthorCurrentUser={isAuthorCurrentUser} className={className}>
			<MessageContent
				text={action.result?.text ?? ''}
				className="text-muted-foreground overflow-x-auto text-xs"
			/>
		</Message>
	);
}
