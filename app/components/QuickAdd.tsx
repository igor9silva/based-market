import { useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Textarea } from '~/components/ui/textarea';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { cn } from '~/lib/utils';

export function QuickAdd({ className }: { className?: string }) {
	//
	const navigate = useNavigate();
	const addTask = useMutation(api.tasks.add);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			body: z.string().min(1, 'Body is required'),
		}),
		handler: async (data) => {
			const taskId = await addTask({ body: data.body });
			navigate({ to: '/tasks/$taskId', params: { taskId } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
		//
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			e.currentTarget.requestSubmit();
		}
	};

	return (
		<Card className={cn('max-h-fit border-none rounded-none', className)}>
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<h3 className="text-md font-semibold">Quick add</h3>
					<div className="flex flex-col gap-0.5">
						<Textarea name="body" required />
					</div>
					<Button type="submit">Create</Button>
				</form>
			</CardContent>
		</Card>
	);
}
