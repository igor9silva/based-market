import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { SendIcon } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Textarea } from '~/components/ui/textarea';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { cn } from '~/lib/utils';

export function MessageComposer({
	className, //
	task,
}: {
	className?: string;
	task: Doc<'tasks'>;
}) {
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const sendMessage = useMutation(api.action.public.say);

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			message: z.string().min(1, 'Message is required'),
		}),
		handler: async (data) => {
			await sendMessage({ taskId: task._id, message: data.message });
		},
	});

	const handleKeyDown = useSubmitHotkey();

	return (
		<div className={cn('p-4 max-h-fit', className)}>
			<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-row gap-2">
				<Textarea ref={textareaRef} name="message" required />
				<Button type="submit">
					<SendIcon className="size-4" />
				</Button>
			</form>
		</div>
	);
}
