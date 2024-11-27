import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { taskActionKindSchema } from 'convex/schema';
import { z } from 'zod';
import { Button } from '~/components/ui/button';

export function RunTaskActionButton({
	task, //
	kind,
}: {
	task: Doc<'tasks'>;
	kind: z.infer<typeof taskActionKindSchema>;
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
