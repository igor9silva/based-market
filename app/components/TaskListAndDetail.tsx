import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { cn } from '~/lib/utils';

import { ListAndDetail } from '~/components/layout/ListAndDetail';
import TaskDetailAndSubstasks from '~/components/TaskDetailAndSubstasks';
import { TaskItem } from '~/components/TaskItem';

export function TaskListAndDetail({
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
		<ListAndDetail
			list={
				<div className="overflow-auto h-full">
					{subtasks.map((task) => (
						<Link key={task._id} to="/$" search={{ selectedSubtaskId: task._id }} resetScroll={false}>
							<TaskItem
								className={cn(selectedSubtaskId === task._id && 'bg-muted rounded-lg')}
								task={task}
							/>
						</Link>
					))}
				</div>
			}
			detail={selectedSubtaskId && <TaskDetailAndSubstasks taskId={selectedSubtaskId} showExpand={true} />}
		/>
	);
}
