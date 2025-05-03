import { useNavigate } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { ArrowRight } from 'lucide-react';
import { TaskStatusIndicator } from '~/components/TaskStatusIndicator';
import { TimeAgo } from '~/components/TimeAgo';
import { Button } from '~/components/ui/button';
import { Checkbox } from '~/components/ui/checkbox';
import { useOptimisticTaskUpdate } from '~/hooks/useOptimisticTaskUpdate';
import { useTaskMutations } from '~/hooks/useTaskMutations';
import { cn } from '~/lib/utils';

export function TaskItem({
	task, //
	className,
}: {
	task: Doc<'tasks'>;
	className?: string;
}) {
	//
	const navigate = useNavigate();
	const { resolve, reopen } = useTaskMutations();
	const { updateTaskStatus } = useOptimisticTaskUpdate();

	const handleCheckboxChange = (checked: boolean) => {
		//
		// Optimistically update UI before the server responds
		updateTaskStatus({ task, isActive: !checked });

		// Execute the actual mutation
		checked ? resolve({ taskId: task._id }) : reopen({ taskId: task._id });
	};

	return (
		<div className={cn('flex items-center justify-between gap-2 p-2 align-middle', className)}>
			<div className="flex items-center gap-2">
				<div
					onClick={(e) => {
						//
						e.preventDefault();
						e.stopPropagation();
					}}
				>
					<Checkbox
						id={`task-list-checkbox-${task._id}`}
						checked={!task.isActive}
						onCheckedChange={handleCheckboxChange}
					/>
				</div>
				<div>
					<div className="flex items-center gap-2">
						<h3
							className={cn(
								'font-semibold leading-none tracking-tight whitespace-pre-wrap break-normal hyphens-auto',
								!task.isActive && 'line-through',
								!task.title && 'text-muted-foreground',
							)}
						>
							{task.title || 'Untitled task'}
						</h3>
						<TaskStatusIndicator task={task} />
					</div>
					<TimeAgo date={task._creationTime} className="text-sm text-muted-foreground" />
				</div>
			</div>
			<Button
				variant="ghost"
				size="icon"
				className="justify-end [&_svg]:size-5 flex-shrink-0"
				onClick={(e) => {
					e.preventDefault();
					navigate({ to: '/$', params: { _splat: `/chat/${task._id}` } });
				}}
			>
				<ArrowRight />
			</Button>
		</div>
	);
}
