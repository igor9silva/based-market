import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc, Id } from 'convex/_generated/dataModel';
import { StatusIndicator } from '~/components/StatusIndicator';
import { cn } from '~/lib/utils';

export const TaskStatus = ({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'>;
	className?: string;
}) => {
	//
	const query = convexQuery(api.action.public.findAllRunning, { taskId });
	const { data: runningActions } = useSuspenseQuery(query);

	return <CollapsedContent actions={runningActions} className={className} />;
};

const CollapsedContent = ({
	actions, //
	className,
}: {
	actions: Doc<'actions'>[];
	className?: string;
}) => {
	//
	return (
		<div className={cn('flex items-center gap-1', className)}>
			<StatusIndicator
				pulse={actions.length > 0}
				className={actions.length > 0 ? 'bg-green-500' : 'bg-gray-500'}
			/>
			<span>{actions.length > 0 ? 'acting' : 'idle'}</span>
		</div>
	);
};
