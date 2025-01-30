import { Doc } from 'convex/_generated/dataModel';
import { TaskStatus } from '~/components/TaskStatus';
import { TimeAgo } from '~/components/TimeAgo';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export function TaskItem({
	task, //
	className,
}: {
	task: Doc<'tasks'>;
	className?: string;
}) {
	return (
		<Card key={task._id} className={cn('border-none rounded-none', className)}>
			<CardContent className="p-4">
				<div className="flex items-start justify-between gap-2">
					<h3
						className={cn(
							'font-semibold leading-none tracking-tight whitespace-pre-wrap break-all space-y-2',
							task.isDone && 'line-through',
							!task.title && 'text-muted-foreground',
						)}
					>
						{task.title || 'Untitled task'}
						{task.body ? (
							<p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
								{task.body.slice(0, 100)}
								{task.body.length > 100 && '...'}
							</p>
						) : (
							<p className="text-sm text-muted-foreground">No description</p>
						)}
					</h3>
					<span className="flex flex-col items-end gap-1 text-sm text-muted-foreground">
						<TimeAgo date={task._creationTime} />
						<TaskStatus taskId={task._id} className="" />
					</span>
				</div>
			</CardContent>
		</Card>
	);
}
