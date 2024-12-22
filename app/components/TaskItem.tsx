import { Doc } from 'convex/_generated/dataModel';
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
				<div className="space-y-1">
					<div className="flex items-start justify-between gap-2">
						<h3
							className={cn(
								'font-semibold leading-none tracking-tight whitespace-pre-wrap break-all',
								task.isDone && 'line-through',
								!task.title && 'text-muted-foreground',
							)}
						>
							{task.title || 'Untitled task'}
						</h3>
						<span className="text-sm text-muted-foreground">
							<TimeAgo date={task._creationTime} />
						</span>
					</div>
					{task.body ? (
						<p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
							{task.body.slice(0, 100)}
							{task.body.length > 100 && '...'}
						</p>
					) : (
						<p className="text-sm text-muted-foreground">No description</p>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
