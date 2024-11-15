import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';

export function TaskComposer() {
	const query = convexQuery(api.users.currentUser, {});
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
		<form onSubmit={handleSubmit} className="flex flex-col gap-2">
			Add task
			<label htmlFor="title">title</label>
			<Input type="text" name="title" required />
			<label htmlFor="body">body</label>
			<Input type="text" name="body" />
			<Button type="submit">Create</Button>
		</form>
	);
}
