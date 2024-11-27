import { Doc } from 'convex/_generated/dataModel';
import { authorSchema } from 'convex/schema';
import { z } from 'zod';
import { TimeAgo } from '~/components/TimeAgo';

function Author({ author }: { author: z.infer<typeof authorSchema> }) {
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
		case 'add':
			return (
				<div className="flex flex-col">
					<div className="flex flex-row justify-between items-baseline">
						<div>
							Added by <Author author={event.author} />.
						</div>
						<span className="text-xs text-muted-foreground">
							<TimeAgo date={event._creationTime} />
						</span>
					</div>
				</div>
			);
		case 'update':
			return (
				<div className="flex flex-col">
					<div className="flex flex-row justify-between items-baseline">
						<div>
							Updated by <Author author={event.author} />.
						</div>
						<span className="text-xs text-muted-foreground">
							<TimeAgo date={event._creationTime} />
						</span>
					</div>
				</div>
			);
		case 'markAsDone':
			return (
				<div className="flex flex-col">
					<div className="flex flex-row justify-between items-baseline">
						<div>
							Marked as <strong>{event.isDone ? 'done' : 'not done'}</strong> by{' '}
							<Author author={event.author} />.
						</div>
						<span className="text-xs text-muted-foreground">
							<TimeAgo date={event._creationTime} />
						</span>
					</div>
				</div>
			);
		case 'actionRequest':
			return (
				<div className="flex flex-col">
					<div className="flex flex-row justify-between items-baseline">
						<div>
							<strong>{event.actionKind}</strong> requested by <Author author={event.author} />
						</div>
						<span className="text-xs text-muted-foreground">
							<TimeAgo date={event._creationTime} />
						</span>
					</div>
					<span className="text-xs text-muted-foreground">#{event.actionId}</span>
				</div>
			);
		case 'actionResult':
			return (
				<div className="flex flex-col">
					<div className="flex flex-row justify-between items-baseline">
						<div>
							<strong>{event.actionKind}</strong> finished
							{event.error && <span className="text-xs text-red-500"> with error: {event.error}.</span>}
							{event.result && (
								<span className="text-xs text-green-500"> with result: {event.result}.</span>
							)}
						</div>
						<span className="text-xs text-muted-foreground">
							<TimeAgo date={event._creationTime} />
						</span>
					</div>
					<span className="text-xs text-muted-foreground">#{event.taskId}</span>
				</div>
			);
		case 'message':
			return (
				<div>
					<Author author={event.author} />: {event.message}
				</div>
			);
	}
}
