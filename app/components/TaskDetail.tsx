import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Maximize2 } from 'lucide-react';
import { TimeAgo } from '~/components/TimeAgo';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import MDX from '~/components/ui/mdx';
import { cn } from '~/lib/utils';
import { EditableContent } from './EditableContent';

export default function TaskDetail({
	taskId,
	className, //
	showExpand = false,
}: {
	taskId: Id<'tasks'>;
	className?: string;
	showExpand?: boolean;
}) {
	const query = convexQuery(api.tasks.public.findOne, { taskId });
	const { data: task } = useSuspenseQuery(query);

	const updateTask = useMutation(api.tasks.public.update);
	const markAsDone = useMutation(api.tasks.public.markAsDone);

	return (
		<Card className={cn('whitespace-pre-wrap border-none rounded-none overflow-auto h-full', className)}>
			<CardHeader className="p-4 max-w-full sticky top-0 bg-background/75 z-10">
				<div className="flex flex-col">
					<div className="flex flex-row justify-between gap-2">
						<EditableContent
							key={task.title}
							value={task.title ?? ''}
							onSave={(newTitle) => updateTask({ taskId: task._id, title: newTitle })}
							viewClassName="text-2xl font-bold leading-none break-all"
							asView={({ value, className, isEmpty }) => (
								<h1 className={cn(task.isDone && 'line-through', className)}>
									{isEmpty ? <span className="text-muted-foreground">Untitled task</span> : value}
								</h1>
							)}
						/>
						{showExpand && (
							<Link to="/$" params={{ _splat: `/chat/${task._id}` }}>
								<Button variant="ghost" size="icon">
									<Maximize2 className="size-4" />
								</Button>
							</Link>
						)}
					</div>
					<span className="text-sm text-muted-foreground shrink-0">
						<TimeAgo date={task._creationTime} />
					</span>
				</div>
				<div className="flex flex-row justify-between">
					<div className="flex flex-row flex-wrap items-baseline gap-2">
						<Button
							variant="secondary"
							onClick={() => markAsDone({ taskId: task._id, isDone: !task.isDone })}
						>
							{task.isDone ? 'Unmark' : 'Mark'} as done
						</Button>
						{/* <RunTaskActionButton task={task} kind="fill" />
					<RunTaskActionButton task={task} kind="minify" />
					<RunTaskActionButton task={task} kind="scrape" />
					<RunTaskActionButton task={task} kind="factCheck" /> */}
					</div>
				</div>
			</CardHeader>
			<CardContent className="p-4 pt-0">
				<EditableContent
					key={task.body}
					value={task.body ?? ''}
					onSave={(newBody) => updateTask({ taskId: task._id, body: newBody })}
					multiline
					asView={({ value, enterEditMode, className, isEmpty }) => (
						<div className={cn('overflow-x-auto', className)}>
							{isEmpty ? (
								<div className="text-muted-foreground">No description</div>
							) : (
								<MDX text={value} onClickFix={enterEditMode} />
							)}
						</div>
					)}
					editClassName="min-h-56"
				/>
			</CardContent>
		</Card>
	);
}
