import { useNavigate } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { ArrowRight } from 'lucide-react';
import { TaskStatus } from '~/components/TaskStatus';
import { TimeAgo } from '~/components/TimeAgo';
import { Button } from '~/components/ui/button';
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

	return (
		<div className={cn('flex items-center justify-between gap-2 p-2 align-middle', className)}>
			<div>
				<h3
					className={cn(
						'font-semibold leading-none tracking-tight whitespace-pre-wrap break-all',
						!task.isActive && 'line-through',
						!task.title && 'text-muted-foreground',
					)}
				>
					{task.title || 'Untitled task'}
				</h3>
				<TimeAgo date={task._creationTime} className="text-sm text-muted-foreground" />
			</div>
			<div className="flex-shrink-0">
				<TaskStatus taskId={task._id} />
				<Button
					variant="ghost"
					size="icon"
					className="justify-end [&_svg]:size-5"
					onClick={(e) => {
						e.preventDefault();
						navigate({ to: '/$', params: { _splat: `/chat/${task._id}` } });
					}}
				>
					<ArrowRight />
				</Button>
			</div>
		</div>
	);
}
