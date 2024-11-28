import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Button } from '~/components/ui/button';

export function RunTaskActionButton({
	task, //
	kind,
}: {
	task: Doc<'tasks'>;
	kind: string;
}) {
	const sendMessage = useMutation(api.taskActions.sendMessage);
	const onClick = () => sendMessage({ taskId: task._id, message: kind });

	return (
		<Button onClick={onClick}>
			{/* */}
			{kind.charAt(0).toUpperCase() + kind.slice(1)}
		</Button>
	);
}
