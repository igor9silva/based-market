import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Button } from '~/components/ui/button';

export function MinifyTaskButton({ task }: { task: Doc<'tasks'> }) {
	//
	const enqueueAction = useMutation(api.taskActions.enqueue);

	return (
		<Button
			onClick={() =>
				enqueueAction({
					taskId: task._id,
					kind: 'minify',
				})
			}
		>
			Minify
		</Button>
	);
}
