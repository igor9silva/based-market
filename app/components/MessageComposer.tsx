import { Doc } from 'convex/_generated/dataModel';
import { SendIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { useTaskMutations } from '~/hooks/useTaskMutations';
import { cn } from '~/lib/utils';

export function MessageComposer({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { say } = useTaskMutations();

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			message: z.string().min(1, 'Message is required'),
		}),
		handler: async ({ message }) => {
			await say({ message, taskId: task._id });
		},
	});

	const handleKeyDown = useSubmitHotkey();

	return (
		<div className={cn('p-4 max-h-fit', className)}>
			<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-row gap-2 items-end">
				<Textarea ref={textareaRef} name="message" required />
				<Button type="submit">
					<SendIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
