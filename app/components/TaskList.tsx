import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Task } from '~/components/Task';
import { cn } from '~/lib/utils';

export function TaskList({ className }: { className?: string }) {
	//
	const query = convexQuery(api.tasks.findAll, {});
	const { data: tasks } = useSuspenseQuery(query);

	return (
		<div className={cn('flex flex-col', className)}>
			{tasks.map((task) => (
				<Task key={task._id} task={task} />
			))}
		</div>
	);
}
