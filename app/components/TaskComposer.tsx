import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { cn } from '~/lib/utils';

export function TaskComposer({ className }: { className?: string }) {
	//
	const query = convexQuery(api.users.current, {});
	const { data: user } = useSuspenseQuery(query);

	const addTask = useMutation(api.tasks.add);

	if (!user) return null;

	// TODO: create a `handleSubmit` hook abstraction that receives just a function
	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		addTask({
			title: formData.get('title') as string,
			body: formData.get('body') as string,
			owner: user._id,
		});

		// Reset the form
		e.currentTarget.reset();
	};

	return (
		<Card className={cn('max-h-fit', className)}>
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} className="flex flex-col gap-2">
					<h3 className="text-md font-semibold">Add a task</h3>
					<div className="flex flex-col gap-0.5">
						<label className="text-sm text-muted-foreground" htmlFor="title">
							title
						</label>
						<Input type="text" name="title" required />
					</div>
					<div className="flex flex-col gap-0.5">
						<label className="text-sm text-muted-foreground" htmlFor="body">
							body
						</label>
						<Input type="text" name="body" />
					</div>
					<Button type="submit">Create</Button>
				</form>
			</CardContent>
		</Card>
	);
}
