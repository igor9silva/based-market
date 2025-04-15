import { Doc, Id } from 'convex/_generated/dataModel';
import { cn } from '~/lib/utils';

import { Message, MessageContent } from '~/components/ui/message';

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

	return (
		<Message isAuthorCurrentUser={isAuthorCurrentUser} className={cn('flex-col', className)}>
			{action.args['reason'] && <p className="text-sm text-muted-foreground">{action.args['reason']}</p>}
			<MessageContent
				isMDX={true}
				text={action.args['message']}
				className={cn({
					'bg-primary text-primary-foreground p-2': isAuthorCurrentUser,
				})}
			/>
		</Message>
	);
}
