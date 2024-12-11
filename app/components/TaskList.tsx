import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { Task } from '~/components/Task';
import { cn } from '~/lib/utils';

export function TaskList({
	parentId, //
	className,
}: {
	parentId?: Id<'tasks'>;
	className?: string;
}) {
	const args = parentId ? { parentId } : {};
	const query = convexQuery(api.tasks.findAll, args);
	const { data: tasks } = useSuspenseQuery(query);

	return (
		<div className={cn('flex flex-col', className)}>
			{tasks.map((task) => (
				<Task key={task._id} task={task} />
			))}
		</div>
	);
}
