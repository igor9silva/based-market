import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import TaskDetail from '~/components/TaskDetail';
import { TaskItem } from '~/components/TaskItem';
import { cn } from '~/lib/utils';

export function TaskList({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'> | 'inbox';
	className?: string;
}) {
	const args = taskId === 'inbox' ? {} : { parentId: taskId };
	const query = convexQuery(api.tasks.findAll, args);
	const { data: subtasks } = useSuspenseQuery(query);

	const { selectedSubtaskId } = useSearch({ strict: false });

	return (
		<div className={cn('flex flex-col', className)}>
			{selectedSubtaskId && <TaskDetail taskId={selectedSubtaskId} />}
			<div>
				{subtasks.map((task) => (
					<Link key={task._id} to="/$" search={{ selectedSubtaskId: task._id }}>
						<TaskItem task={task} />
					</Link>
				))}
			</div>
		</div>
	);
}
