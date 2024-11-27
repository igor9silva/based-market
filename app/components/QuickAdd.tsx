import { useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { cn } from '~/lib/utils';

export function QuickAdd({ className }: { className?: string }) {
	//
	const navigate = useNavigate();
	const addTask = useMutation(api.tasks.add);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			title: z.string().min(1, 'Title is required'),
		}),
		handler: async (data) => {
			const taskId = await addTask({ title: data.title });
			navigate({ to: '/tasks/$taskId', params: { taskId } });
		},
	});

	return (
		<Card className={cn('max-h-fit', className)}>
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} className="flex flex-col gap-2">
					<h3 className="text-md font-semibold">Quick add</h3>
					<div className="flex flex-col gap-0.5">
						<Input type="text" name="title" required />
					</div>
					<Button type="submit">Create</Button>
				</form>
			</CardContent>
		</Card>
	);
}
