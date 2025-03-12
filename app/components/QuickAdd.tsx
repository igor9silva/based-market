import { useNavigate, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { asBigInt } from 'convex/utils/money';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '~/lib/utils';

import { INSUFFICIENT_ACCOUNT_FUNDS_ERROR, isError } from 'convex/utils/errors';
import { BudgetSelector } from '~/components/ui/budget-selector';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Textarea } from '~/components/ui/textarea';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';

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
			message: z.string().min(1, 'Message is required'),
			initialFunds: z.coerce.number().min(0).max(100).default(0.1),
		}),
		shouldAlwaysClearForm: false,
		handler: async ({ message, initialFunds }) => {
			//
			console.debug('QuickAdd', message, initialFunds);

			try {
				//
				const taskId = await addTask({
					message,
					initialFunds: asBigInt({ dollars: initialFunds }),
				});

				navigate({ to: '/$', params: { _splat: `/chat/${taskId}` } });
				//
			} catch (error: unknown) {
				//
				if (isError(INSUFFICIENT_ACCOUNT_FUNDS_ERROR, error)) {
					toast.error('Account funds are insufficient.', {
						description: 'Top up or decrease the task budget.',
						action: {
							label: 'Top up',
							onClick: () => navigate({ to: '/top-up' }),
						},
					});
				} else {
					toast.error('An unknown error occurred while starting the task.');
				}
			}
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className={cn('max-h-fit border-none rounded-none p-4', className)}>
			<CardContent className="p-0">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<Textarea
							ref={textareaRef}
							name="message"
							placeholder="What are you seeking?"
							required
							defaultValue={newTaskText}
							className="min-h-32 resize-none text-base"
						/>
					</div>
					<BudgetSelector name="initialFunds" defaultValue={0.1} />
					<Button variant="default" type="submit" size="lg">
						Seek it
						<kbd className="hidden md:inline-flex h-5 items-center gap-1 rounded border px-2 font-mono text-xs ml-2">
							<span className="text-base">⌘</span>Enter
						</kbd>
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
