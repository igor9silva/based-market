import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { TaskAction } from './TaskAction';

export function TaskActionQueue({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const query = convexQuery(api.taskActions.findAll, { taskId: task._id });
	const { data: actions } = useSuspenseQuery(query);

	return (
		<Card className={cn('whitespace-pre-wrap', className)}>
			<CardContent className="space-y-4">
				<h3 className="text-lg font-semibold">Action Queue</h3>
				{actions.map((action) => (
					<TaskAction action={action} />
				))}
			</CardContent>
		</Card>
	);
}
