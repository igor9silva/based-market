import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '~/lib/utils';

export function TaskActionList({ task }: { task: Doc<'tasks'> }) {
	//
	const query = convexQuery(api.taskActions.list, { taskId: task._id });
	const { data: actions } = useSuspenseQuery(query);

	return (
		<>
			{actions.map((action) => (
				<div key={action._id} className="flex flex-col gap-1 py-2">
					<div className="flex items-center justify-between">
						<div className={cn('font-medium', action.isDone && 'line-through')}>{action.kind}</div>
						<div className="text-sm text-muted-foreground">{action.status}</div>
					</div>
					<div className="text-xs text-muted-foreground">
						enqueued {formatDistanceToNow(new Date(action._creationTime), { addSuffix: true })}
					</div>
				</div>
			))}
		</>
	);
}
