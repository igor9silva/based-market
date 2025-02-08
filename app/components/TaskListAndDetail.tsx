import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { cn } from '~/lib/utils';

import { ListAndDetail } from '~/components/layout/ListAndDetail';
import TaskDetail from '~/components/TaskDetail';
import { TaskItem } from '~/components/TaskItem';

export function TaskListAndDetail({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'> | 'inbox';
	className?: string;
}) {
	const args = taskId === 'inbox' ? {} : { parentId: taskId };
	const query = convexQuery(api.tasks.public.findAll, args);
	const { data: subtasks } = useSuspenseQuery(query);

	const { selectedSubtaskId } = useSearch({ strict: false });

	return (
		<ListAndDetail
			list={
				<div className="overflow-auto h-full">
					{subtasks.map((task) => (
						<Link
							key={task._id}
							to="/$"
							search={{ selectedSubtaskId: selectedSubtaskId === task._id ? undefined : task._id }}
							resetScroll={false}
						>
							<TaskItem className={cn(selectedSubtaskId === task._id && 'bg-muted')} task={task} />
						</Link>
					))}
				</div>
			}
			detail={
				selectedSubtaskId && (
					<TaskDetail
						taskId={selectedSubtaskId}
						showExpand={false}
						className="animate-in slide-in-from-right duration-100"
					/>
				)
			}
		/>
	);
}
