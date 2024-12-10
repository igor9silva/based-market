import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { TimeAgo } from '~/components/TimeAgo';
import { Button } from '~/components/ui/button';
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
	const markAsDone = useMutation(api.tasks.markAsDone);

	return (
		<Card className={cn('whitespace-pre-wrap border-none rounded-none overflow-auto', className)}>
			<CardHeader className="p-4 max-w-full sticky top-0 bg-background/75 z-10">
				<div className="flex flex-col">
					<EditableContent
						key={task.title}
						value={task.title}
						onSave={(newTitle) => updateTask({ taskId: task._id, title: newTitle })}
						viewClassName="text-2xl font-bold leading-none break-all"
						asView={({ value, onClick, className, isEmpty }) => (
							<h1 onClick={onClick} className={cn(task.isDone && 'line-through', className)}>
								{isEmpty ? <span className="text-muted-foreground">Untitled task</span> : value}
							</h1>
						)}
					/>
					<span className="text-sm text-muted-foreground shrink-0">
						<TimeAgo date={task._creationTime} />
					</span>
				</div>
				<div className="flex flex-row flex-wrap items-baseline gap-2">
					<Button variant="secondary" onClick={() => markAsDone({ taskId: task._id, isDone: !task.isDone })}>
						{task.isDone ? 'Unmark' : 'Mark'} as done
					</Button>
					{/* <RunTaskActionButton task={task} kind="fill" />
					<RunTaskActionButton task={task} kind="minify" />
					<RunTaskActionButton task={task} kind="scrape" />
					<RunTaskActionButton task={task} kind="factCheck" /> */}
				</div>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<EditableContent
					key={task.body}
					value={task.body ?? ''}
					onSave={(newBody) => updateTask({ taskId: task._id, body: newBody })}
					multiline
					asView={({ value, onClick, className, isEmpty }) => (
						<div onClick={onClick} className={className}>
							{isEmpty ? (
								<div className="text-muted-foreground">No description</div>
							) : (
								<MDX text={value} />
							)}
						</div>
					)}
					editClassName="min-h-56"
				/>
			</CardContent>
		</Card>
	);
}
