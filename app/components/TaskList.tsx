import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { cn } from '~/lib/utils';

import { BasicError } from '~/components/BasicError';
import { ListAndDetail } from '~/components/layout/ListAndDetail';
import { Loading } from '~/components/Loading';
import TaskDetail from '~/components/TaskDetail';
import { TaskItem } from '~/components/TaskItem';

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
			detail={
				selectedSubtaskId && (
					<Suspense fallback={<Loading />}>
						<ErrorBoundary fallback={<BasicError text="Not found (or something else went wrong)." />}>
							<TaskDetail taskId={selectedSubtaskId} showExpand={true} />
						</ErrorBoundary>
					</Suspense>
				)
			}
		/>
	);
}
