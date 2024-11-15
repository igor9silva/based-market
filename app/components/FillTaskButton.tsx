import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Button } from '~/components/ui/button';

export function FillTaskButton({ task }: { task: Doc<'tasks'> }) {
	//
	// TODO: write a prettier abstraction for optmistc updates
	const startFilling = useMutation(api.tasks.startFilling).withOptimisticUpdate((store, args) => {
		const existing = store.getQuery(api.tasks.findOne, { taskId: args.taskId });
		if (!existing) return;
		store.setQuery(
			api.tasks.findOne,
			{ taskId: args.taskId },
			{
				...existing,
				effects: [...(existing.effects || []), 'filling'],
			},
		);
	});

	const isFilling = task.effects?.includes('filling') || false;

	return (
		<Button onClick={() => startFilling({ taskId: task._id })} disabled={isFilling}>
			{isFilling ? 'Filling...' : 'Fill'}
		</Button>
	);
}
