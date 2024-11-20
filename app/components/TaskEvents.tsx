import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export function TaskEvents({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const query = convexQuery(api.taskEvents.findAll, { taskId: task._id });
	const { data: events } = useSuspenseQuery(query);

	return (
		<Card className={cn('whitespace-pre-wrap', className)}>
			<CardContent className="space-y-4">
				<h3 className="text-lg font-semibold">Events</h3>
				{events.map((event) => (
					<div key={event._id}>{event.kind}</div>
					// <TaskEvent key={event._id} event={event} />
				))}
			</CardContent>
		</Card>
	);
}
