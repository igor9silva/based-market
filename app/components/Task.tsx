import { Link } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';
import { Card, CardContent } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { cn } from '~/lib/utils';

export function Task({ task }: { task: Doc<'tasks'> }) {
	return (
		<Link to="/tasks/$taskId" params={{ taskId: task._id }}>
			<Card key={task._id} className="border-none rounded-none">
				<CardContent className="pt-6">
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
			<Separator />
		</Link>
	);
}
