import { useNavigate, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Textarea } from '~/components/ui/textarea';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { cn } from '~/lib/utils';

export function QuickAdd({ className }: { className?: string }) {
	//
	const navigate = useNavigate();
	const addTask = useMutation(api.tasks.public.add);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	const { newTaskText } = useSearch({ strict: false });

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			body: z.string().min(1, 'Body is required'),
			initialFunds: z.coerce.number().min(0).max(100000).default(0.1),
		}),
		handler: async ({ body, initialFunds }) => {
			console.debug('QuickAdd', body, initialFunds);
			const taskId = await addTask({ body, initialFunds });
			navigate({ to: '/$', params: { _splat: `/chat/${taskId}` } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	const [budget, setBudget] = useState(0.1);

	return (
		<Card className={cn('max-h-fit border-none rounded-none p-4', className)}>
			<CardContent className="p-0">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<Textarea
							ref={textareaRef}
							name="body"
							placeholder="What are you seeking?"
							required
							defaultValue={newTaskText}
							className="min-h-80"
						/>
					</div>
					<div className="flex flex-col gap-0.5">
						<p className="text-sm text-muted-foreground">Budget</p>
						<Input
							type="number"
							name="initialFunds"
							min={0}
							max={100000}
							step={0.01}
							value={budget}
							onChange={(e) => setBudget(parseFloat(e.target.value))}
						/>
					</div>
					<Button variant="default" type="submit">
						Add
						<kbd className="hidden md:inline-flex h-4 items-center gap-0.5 rounded border px-1 font-mono text-xs">
							<span className="text-base">⌘</span>Enter
						</kbd>
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
