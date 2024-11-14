import { Doc } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent } from '~/components/ui/card';

export function Task({ task }: { task: Doc<'tasks'> }) {
	return (
		<Card key={task._id}>
			<CardContent className="pt-6">
				<div className="space-y-1">
					<div className="flex items-start justify-between">
						<h3 className="font-semibold leading-none tracking-tight">{task.title}</h3>
						<span className="text-sm text-muted-foreground">
							{formatDistanceToNow(new Date(task._creationTime), { addSuffix: true })}
						</span>
					</div>
					{task.body && <p className="text-sm text-muted-foreground">{task.body}</p>}
				</div>
			</CardContent>
		</Card>
	);
}
