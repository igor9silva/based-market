import { useNavigate, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { asBigInt } from 'convex/utils/money';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '~/lib/utils';

import { INSUFFICIENT_ACCOUNT_FUNDS_ERROR, isError } from 'convex/utils/errors';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Slider } from '~/components/ui/slider';
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
			description: z.string().min(1, 'Description is required'),
			initialFunds: z.coerce.number().min(0).max(100000).default(0.1),
		}),
		shouldAlwaysClearForm: false,
		handler: async ({ description, initialFunds }) => {
			//
			console.debug('QuickAdd', description, initialFunds);

			try {
				//
				const taskId = await addTask({
					description,
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

	// all possible selections
	const steps = [0, 0.1, 1, 10, 100];
	const [budget, setBudget] = useState(0.1);

	return (
		<Card className={cn('max-h-fit border-none rounded-none p-4', className)}>
			<CardContent className="p-0">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-6">
					<div className="flex flex-col gap-2">
						<Textarea
							ref={textareaRef}
							name="description"
							placeholder="What are you seeking?"
							required
							defaultValue={newTaskText}
							className="min-h-[240px] resize-none text-base"
						/>
					</div>
					<div className="flex flex-row gap-2">
						<div className="flex flex-col flex-shrink-0">
							<p className="text-sm text-muted-foreground">Spend up to</p>
							<p className="text-sm font-medium tabular-nums">USD {budget.toFixed(2)}</p>
						</div>
						<Slider
							name="initialFunds"
							min={0}
							max={4}
							step={1}
							value={[steps.indexOf(budget)]}
							onValueChange={(value: number[]) => setBudget(steps[value[0]])}
							className="py-2"
						/>
					</div>
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
