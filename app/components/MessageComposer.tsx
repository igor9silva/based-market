import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { SendIcon } from 'lucide-react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { cn } from '~/lib/utils';

export function MessageComposer({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const sendMessage = useMutation(api.taskEvents.sendMessage);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			message: z.string().min(1, 'Message is required'),
		}),
		handler: async (data) => {
			await sendMessage({ taskId: task._id, message: data.message });
		},
	});

	return (
		<div className={cn('p-4 max-h-fit', className)}>
			<form onSubmit={handleSubmit} className="flex flex-row gap-2">
				<Input type="text" name="message" required />
				<Button type="submit">
					<SendIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
