import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Task } from '~/components/Task';

export function TaskList() {
	const query = convexQuery(api.tasks.list, {});
	const { data: tasks } = useSuspenseQuery(query);

	return (
		<>
			{tasks.map((task) => (
				<Task key={task._id} task={task} />
			))}
		</>
	);
}
