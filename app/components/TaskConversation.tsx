import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { MessageComposer } from '~/components/MessageComposer';
import { TaskEvent } from '~/components/TaskEvent';
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
		<div className={cn('flex flex-col whitespace-pre-wrap overflow-auto', className)}>
			<h2 className="text-2xl font-bold leading-none break-all sticky top-0 bg-background/75 p-4">
				Conversation
			</h2>
			<div className="p-4 flex-grow flex flex-col justify-end">
				{events.map((event) => (
					<TaskEvent key={event._id} event={event} />
				))}
			</div>
			<MessageComposer className="sticky bottom-0 bg-background/75 p-4" task={task} />
		</div>
	);
}
