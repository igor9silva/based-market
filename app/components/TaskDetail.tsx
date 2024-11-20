import { Doc } from 'convex/_generated/dataModel';
import { RunTaskActionButton } from '~/components/RunTaskActionButton';
import { TimeAgo } from '~/components/TimeAgo';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
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
			<CardHeader className="max-w-full">
				<div className="flex flex-col">
					<h1 className="text-2xl font-bold leading-none break-all">{task.title}</h1>
					<span className="text-sm text-muted-foreground shrink-0">
						<TimeAgo date={task._creationTime} />
					</span>
				</div>
				<div className="flex flex-row flex-wrap items-baseline gap-2">
					<RunTaskActionButton task={task} kind="fill" />
					<RunTaskActionButton task={task} kind="minify" />
					<RunTaskActionButton task={task} kind="scrape" />
					<RunTaskActionButton task={task} kind="factCheck" />
				</div>
			</CardHeader>
			<CardContent className="[&>*]:whitespace-break-spaces [&>*]:break-all pt-0">
				<Content />
			</CardContent>
		</Card>
	);
}
