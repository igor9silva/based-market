import { Doc } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { FillTaskButton } from '~/components/FillTaskButton';
import { MinifyTaskButton } from '~/components/MinifyTaskButton';
import { Card, CardContent, CardFooter } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export default function TaskDetail({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	return (
		<Card className={cn('whitespace-pre-wrap', className)}>
			<CardContent className="pt-6">
				<div className="space-y-1">
					<div className="flex items-start justify-between">
						<h1 className="text-2xl font-bold leading-none tracking-tight">{task.title}</h1>
						<span className="text-sm text-muted-foreground">
							{formatDistanceToNow(new Date(task._creationTime), { addSuffix: true })}
						</span>
					</div>
					{task.body && <p className="text-sm text-muted-foreground">{task.body}</p>}
				</div>
			</CardContent>
			<CardFooter className="flex gap-2">
				<FillTaskButton task={task} />
				<MinifyTaskButton task={task} />
			</CardFooter>
		</Card>
	);
}
