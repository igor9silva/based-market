import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { SendIcon } from 'lucide-react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
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

	// send on CMD+Enter
	const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
		//
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			e.currentTarget.requestSubmit();
		}
	};

	return (
		<div className={cn('p-4 max-h-fit', className)}>
			<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-row gap-2">
				<Textarea name="message" required />
				<Button type="submit">
					<SendIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
