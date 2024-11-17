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
	// TODO: write a prettier abstraction for optmistc updates
	const enqueueAction = useMutation(api.taskActions.enqueue);
	// .withOptimisticUpdate((store, args) => {
	// 	//
	// 	const existing = store.getQuery(api.tasks.findOne, { taskId: args.taskId });
	// 	if (!existing) return;

	// 	store.setQuery(
	// 		api.tasks.findOne,
	// 		{ taskId: args.taskId },
	// 		{
	// 			...existing,
	// 			effects: [...(existing.effects || []), 'filling'],
	// 		},
	// 	);
	// });

	return (
		<Button
			onClick={() =>
				enqueueAction({
					taskId: task._id,
					kind: kind,
				})
			}
		>
			{kind.charAt(0).toUpperCase() + kind.slice(1)}
		</Button>
	);
}
