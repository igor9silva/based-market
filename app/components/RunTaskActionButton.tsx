import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { taskActionKinds } from 'convex/schema';
import { Infer } from 'convex/values';
import { Button } from '~/components/ui/button';

export function RunTaskActionButton({
	task, //
	kind,
}: {
	task: Doc<'tasks'>;
	kind: Infer<typeof taskActionKinds>;
}) {
	const requestAction = useMutation(api.taskActions.request);

	return (
		<Button
			onClick={() =>
				requestAction({
					taskId: task._id,
					kind: kind,
				})
			}
		>
			{kind.charAt(0).toUpperCase() + kind.slice(1)}
		</Button>
	);
}
