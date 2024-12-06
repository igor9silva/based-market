import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { MessageComposer } from '~/components/MessageComposer';
import { TaskEvent } from '~/components/TaskEvent';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export function TaskConversation({
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
				<h3 className="text-lg font-semibold">Conversation</h3>
				{events.map((event) => (
					<TaskEvent key={event._id} event={event} />
				))}
			</CardContent>
			<MessageComposer task={task} />
		</Card>
	);
}
