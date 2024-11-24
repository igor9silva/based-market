import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { RunTaskActionButton } from '~/components/RunTaskActionButton';
import { TimeAgo } from '~/components/TimeAgo';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import MDX from '~/components/ui/mdx';
import { cn } from '~/lib/utils';
import { EditableContent } from './EditableContent';

export default function TaskDetail({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const updateTask = useMutation(api.tasks.update);

	return (
		<Card className={cn('whitespace-pre-wrap', className)}>
			<CardHeader className="max-w-full">
				<div className="flex flex-col">
					<EditableContent
						value={task.title}
						onSave={(newTitle) => updateTask({ taskId: task._id, title: newTitle })}
						viewClassName="text-2xl font-bold leading-none break-all"
						as="h1"
					/>
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
				<EditableContent
					value={task.body ?? ''}
					onSave={(newBody) => updateTask({ taskId: task._id, body: newBody })}
					multiline
					asView={({ value, onClick, className }) => (
						<div onClick={onClick} className={className}>
							<MDX text={value} />
						</div>
					)}
					editClassName="min-h-32 font-mono"
				/>
			</CardContent>
		</Card>
	);
}
