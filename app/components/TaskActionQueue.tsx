import { Doc } from 'convex/_generated/dataModel';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';
import { TaskActionList } from './TaskActionList';

export function TaskActionQueue({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	return (
		<Card className={cn('whitespace-pre-wrap', className)}>
			<CardContent className="pt-6">
				<h3 className="text-md font-semibold">Action Queue</h3>
				<TaskActionList task={task} />
			</CardContent>
		</Card>
	);
}
