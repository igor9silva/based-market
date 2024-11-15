import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Button } from '~/components/ui/button';

export function FillTaskButton({ task }: { task: Doc<'tasks'> }) {
	//
	// TODO: write a prettier abstraction for optmistc updates
	const startFilling = useMutation(api.taskActions.enqueue);
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
				startFilling({
					taskId: task._id,
					kind: 'fill',
				})
			}
		>
			Fill
		</Button>
	);
}
