import { Link } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '~/components/ui/card';

export function Task({ task }: { task: Doc<'tasks'> }) {
	return (
		<Link to="/inbox/$taskId" params={{ taskId: task._id }}>
			<Card key={task._id}>
				<CardContent className="pt-6">
					<div className="space-y-1">
						<div className="flex items-start justify-between">
							<h3 className="font-semibold leading-none tracking-tight whitespace-pre-wrap break-all">
								{task.title}
							</h3>
							<span className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(task._creationTime), { addSuffix: true })}
							</span>
						</div>
						{task.body && (
							<p className="text-sm text-muted-foreground whitespace-pre-wrap break-all">
								{task.body.slice(0, 100)}
								{task.body.length > 100 && '...'}
							</p>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}
