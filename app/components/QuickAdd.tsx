import { useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Textarea } from '~/components/ui/textarea';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { cn } from '~/lib/utils';

export function QuickAdd({ className }: { className?: string }) {
	//
	const navigate = useNavigate();
	const addTask = useMutation(api.tasks.add);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			body: z.string().min(1, 'Body is required'),
		}),
		handler: async (data) => {
			const taskId = await addTask({ body: data.body });
			navigate({ to: '/$', params: { _splat: `/chat/${taskId}` } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className={cn('max-h-fit border-none rounded-none', className)}>
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<Textarea
							ref={textareaRef}
							name="body"
							placeholder="What are you seeking to achieve?"
							required
						/>
					</div>
					<Button variant="default" type="submit">
						Add
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
