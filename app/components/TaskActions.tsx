import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { TaskAction } from '~/components/TaskActionV2';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export function TaskActions({
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
				<h3 className="text-lg font-semibold">Events</h3>
				{actions.map((action) => (
					<TaskAction key={action._id} action={action} />
				))}
			</CardContent>
		</Card>
	);
}
