import { Doc, Id } from 'convex/_generated/dataModel';

import { GenericAction } from '~/components/actions/generic';
import { FailedMessage, SimpleMessage } from '~/components/ui/message';
import { useIsNew } from '~/hooks/useIsNew';

export function UpdateInstructionsAction(props: {
	className?: string;
	action: Doc<'actions'>;
	initialRenderDate: Date;
	isAuthorCurrentUser: boolean;
	taskId: Id<'tasks'>;
}) {
	const { action, initialRenderDate, isAuthorCurrentUser, taskId } = props;
	const isNew = useIsNew(action._creationTime, initialRenderDate);

	switch (action.status) {
		//
		case 'enqueued':
		case 'skipped':
			return null;

		case 'pending authorization':
			return <GenericAction {...props} />;

		case 'failed':
			return <FailedMessage text={`🚫 Failed to update instructions`} error={action.result ?? ''} />;

		case 'running':
			return <SimpleMessage running text={`✍️ Updating instructions`} />;

		case 'succeeded':
			return <SimpleMessage text={`Updated instructions.`} />;
	}
}
