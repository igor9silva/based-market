import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { asDollars } from 'convex/utils/money';
import { CircleDollarSign, Maximize2 } from 'lucide-react';
import { TimeAgo } from '~/components/TimeAgo';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import MDX from '~/components/ui/mdx';
import { useTaskMutations } from '~/hooks/useTaskMutations';
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
	const { updateInstructions, resolve, reopen } = useTaskMutations();

	const handleCheckboxChange = (hasChecked: boolean) => {
		hasChecked ? resolve({ taskId: task._id }) : reopen({ taskId: task._id });
	};

	return (
		<Card className={cn('whitespace-pre-wrap border-none rounded-none overflow-auto h-full p-4 md:p-0', className)}>
			<CardHeader className="p-0 md:p-4 max-w-full sticky top-0 bg-background/75 z-10">
				<div className="flex flex-col">
					<div className="flex flex-row justify-between gap-2">
						<div className="flex items-center gap-2">
							<Checkbox
								id={`task-checkbox-${task._id}`}
								checked={!task.isActive}
								onCheckedChange={handleCheckboxChange}
							/>
							<EditableContent
								key={task.title}
								value={task.title ?? ''}
								onSave={(newTitle) => updateInstructions({ taskId: task._id, title: newTitle })}
								viewClassName="text-2xl font-bold leading-none whitespace-normal overflow-wrap-normal break-normal hyphens-none"
								asView={({ value, className, isEmpty }) => (
									<h1 className={cn(!task.isActive && 'line-through', className)}>
										{isEmpty ? <span className="text-muted-foreground">Untitled task</span> : value}
									</h1>
								)}
							/>
						</div>
						<div className="flex flex-row flex-shrink-0 items-center gap-1">
							<CircleDollarSign className="size-4" />
							{asDollars({ bigInt: task.budgetUSDC.available })}
						</div>
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
				{/* <div className="flex flex-row justify-between">
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
					<RunTaskActionButton task={task} kind="factCheck" /> *
					</div>
				</div> */}
			</CardHeader>
			<CardContent className="p-0 md:p-4 md:pt-0">
				<EditableContent
					key={task.instructions}
					value={task.instructions ?? ''}
					onSave={(newInstructions) =>
						updateInstructions({ taskId: task._id, instructions: newInstructions })
					}
					multiline
					asView={({ value, enterEditMode, className, isEmpty }) => (
						<div className={cn('overflow-x-auto', className)}>
							{isEmpty ? (
								<div className="text-muted-foreground text-sm">No instructions.</div>
							) : (
								<MDX text={value} onClickFix={enterEditMode} />
							)}
						</div>
					)}
					editClassName="min-h-56"
				/>
			</CardContent>
			{/* {task.summary && (
				<>
					<Separator />
					<CardFooter className="p-0 md:p-4 ">
						<MDX text={task.summary} />
					</CardFooter>
				</>
			)} */}
		</Card>
	);
}
