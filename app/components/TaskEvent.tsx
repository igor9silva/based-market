import { Doc, Id } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';

function Author({ author }: { author: Id<'users'> | 'meseeks' }) {
	return <strong>{author === 'meseeks' ? 'Meseeks' : 'you'}</strong>;
}

export function TaskEvent({
	className, //
	event,
}: {
	className?: string;
	event: Doc<'taskEvents'>;
}) {
	//
	switch (event.kind) {
		case 'actionRequest':
			return (
				<div className="flex flex-col">
					<div className="flex flex-row justify-between items-baseline">
						<div>
							<strong>{event.action}</strong> requested by <Author author={event.author} />
						</div>
						<span className="text-xs text-muted-foreground">
							<TimeAgo date={event._creationTime} />
						</span>
					</div>
					<span className="text-xs text-muted-foreground">#{event.taskId}</span>
				</div>
			);
		case 'actionResult':
			return (
				<div>
					{event.kind} finished. {event.error ?? event.result}
				</div>
			);
		case 'message':
			return (
				<div>
					<Author author={event.author} />: {event.message}
				</div>
			);
	}

	// return (
	// 	<Card className={cn('p-4', className)}>
	// 		<div className="flex flex-col gap-2">
	// 			{/* Event Type */}
	// 			<div className="text-sm font-medium text-muted-foreground">{getEventDetails()}</div>

	// 			{/* Author */}
	// 			<div className="text-base">By: {formatAuthor(event.author)}</div>

	// 			{/* Timestamp */}
	// 			<div className="text-xs text-muted-foreground">{new Date(event._creationTime).toLocaleString()}</div>
	// 		</div>
	// 	</Card>
	// );
}
