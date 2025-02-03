import { Doc } from 'convex/_generated/dataModel';
import { TaskStatus } from '~/components/TaskStatus';
import { TimeAgo } from '~/components/TimeAgo';
import { cn } from '~/lib/utils';

export function TaskItem({
	task, //
	className,
}: {
	task: Doc<'tasks'>;
	className?: string;
}) {
	return (
		<div className={cn('flex items-center justify-between gap-2 p-2 align-middle', className)}>
			<div>
				<h3
					className={cn(
						'font-semibold leading-none tracking-tight whitespace-pre-wrap break-all',
						task.isDone && 'line-through',
						!task.title && 'text-muted-foreground',
					)}
				>
					{task.title || 'Untitled task'}
				</h3>
				<TimeAgo date={task._creationTime} className="text-sm text-muted-foreground" />
			</div>
			<TaskStatus taskId={task._id} className="flex-shrink-0" />
		</div>
	);
}
