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
	const callTool = useMutation(api.taskEvents.callTool);
	const onClick = () =>
		callTool({
			toolName: kind,
			taskId: task._id,
			args: {},
		});

	return (
		<Button onClick={onClick}>
			{/* */}
			{kind.charAt(0).toUpperCase() + kind.slice(1)}
		</Button>
	);
}
