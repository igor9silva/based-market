import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { MoveDown } from 'lucide-react';
import { useMemo } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { MessageComposer } from '~/components/MessageComposer';
import { TaskEvent } from '~/components/TaskEvent';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function TaskConversation({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'>;
	className?: string;
}) {
	const taskQuery = convexQuery(api.tasks.findOne, { taskId });
	const { data: task } = useSuspenseQuery(taskQuery);

	const eventsQuery = convexQuery(api.events.findAll, { taskId: task._id });
	const { data: events } = useSuspenseQuery(eventsQuery);

	const initialRenderDate = useMemo(() => new Date(), []);

	return (
		<StickToBottom mass={1} className={cn('flex flex-col h-full whitespace-pre-wrap overflow-auto', className)}>
			<StickToBottom.Content className="relative h-full">
				<h2 className="text-2xl font-bold leading-none break-all sticky top-0 bg-background/75 p-4">
					Conversation
				</h2>
				<div className="p-4 flex flex-col flex-grow justify-end">
					{events.map((event) => (
						<TaskEvent key={event._id} event={event} initialRenderDate={initialRenderDate} />
					))}
				</div>
				<div className="sticky bottom-0 flex flex-col">
					<ScrollToBottom />
					<MessageComposer task={task} className="bg-background/75 p-2" />
				</div>
			</StickToBottom.Content>
		</StickToBottom>
	);
}

function ScrollToBottom() {
	//
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();
	const onClick = () => scrollToBottom();

	return (
		!isAtBottom && (
			<div className="flex justify-center z-10">
				<Button variant="outline" className="p-1 size-5 [&_svg]:size-3 bg-background/75" onClick={onClick}>
					<MoveDown />
				</Button>
			</div>
		)
	);
}
