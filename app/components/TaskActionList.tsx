import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { formatDistanceToNow } from 'date-fns';
import { X } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function TaskActionList({ task }: { task: Doc<'tasks'> }) {
	//
	const query = convexQuery(api.taskActions.findAll, { taskId: task._id });
	const { data: actions } = useSuspenseQuery(query);

	const cancelAction = useMutation(api.taskActions.cancel);

	return (
		<>
			{actions.map((action) => (
				<div key={action._id} className="flex flex-col gap-1 py-2">
					<div className="flex items-center justify-between">
						<div className={cn('font-medium', action.isDone && 'line-through')}>{action.kind}</div>
						<div className="text-sm text-muted-foreground">{action.status}</div>
					</div>
					<div className="flex items-center justify-between">
						<div className="text-xs text-muted-foreground">
							enqueued {formatDistanceToNow(new Date(action._creationTime), { addSuffix: true })}
						</div>
						{action.status === 'pending' && (
							<Button
								variant={'destructive'}
								className=""
								onClick={() => cancelAction({ actionId: action._id })}
							>
								<X />
							</Button>
						)}
					</div>
				</div>
			))}
		</>
	);
}
