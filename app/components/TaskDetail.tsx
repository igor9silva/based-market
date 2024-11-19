import { Doc } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { RunTaskActionButton } from '~/components/RunTaskActionButton';
import { Card, CardContent } from '~/components/ui/card';
import { useMDX } from '~/hooks/useMDX';
import { cn } from '~/lib/utils';

export default function TaskDetail({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const Content = useMDX(task.body ?? '');

	return (
		<Card className={cn('whitespace-pre-wrap', className)}>
			<CardContent className="pt-6">
				<div className="space-y-4">
					<div className="flex items-start justify-between">
						<h1 className="text-2xl font-bold leading-none tracking-tight">{task.title}</h1>
						<span className="text-sm text-muted-foreground">
							{formatDistanceToNow(new Date(task._creationTime), { addSuffix: true })}
						</span>
					</div>
					<div className="flex flex-row items-baseline gap-2">
						<RunTaskActionButton task={task} kind="fill" />
						<RunTaskActionButton task={task} kind="minify" />
						<RunTaskActionButton task={task} kind="scrape" />
						<RunTaskActionButton task={task} kind="factCheck" />
					</div>
					<Content />
				</div>
			</CardContent>
		</Card>
	);
}
