import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useNavigate } from '@tanstack/react-router';
import { PlusIcon } from 'lucide-react';
// import { api } from 'convex/_generated/api';
// import { useQuery } from 'convex/react';
import * as React from 'react';

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from '~/components/ui/command';

export function CommandMenu() {
	//
	const [open, setOpen] = React.useState(false);
	const navigate = useNavigate();
	// const tasks = useQuery(api.tasks.findAll);

	React.useEffect(() => {
		//
		const down = (e: KeyboardEvent) => {
			//
			// CMD+K
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setOpen((open) => !open);
			}
		};

		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
		//
	}, []);

	const onSelect = React.useCallback(
		(value: string) => {
			setOpen(false);
			navigate({ to: value as any });
		},
		[navigate],
	);

	return (
		<CommandDialog open={open} onOpenChange={setOpen}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				<CommandGroup heading="Navigation">
					<CommandItem value="/new" onSelect={onSelect}>
						<PlusIcon className="mr-2" />
						New Task
					</CommandItem>
					<CommandItem value="/" onSelect={onSelect}>
						{/* <Link to="/$" params={{ _splat: '' }}> */}
						<MagnifyingGlassIcon className="mr-2" />
						Inbox
						{/* </Link> */}
					</CommandItem>
					<CommandItem value="/list/kh70vk1fpyg3mkf0jg1wmeerg9768ngv" onSelect={onSelect}>
						<MagnifyingGlassIcon className="mr-2" />
						Finances
					</CommandItem>
				</CommandGroup>
				<CommandGroup heading="Test Tasks">
					<CommandItem value="/chat/kh73ekz89d5awan6pejdwdp5v176690k" onSelect={onSelect}>
						<MagnifyingGlassIcon className="mr-2" />
						Test Task 1
					</CommandItem>
					<CommandItem value="/chat/kh753rpp5dz4pn4zc8x2jdz3cs763kp1" onSelect={onSelect}>
						<MagnifyingGlassIcon className="mr-2" />
						Test Task 2
					</CommandItem>
					<CommandItem value="/chat/kh78yn9ffq0ph7g5cgqmh482a9763de2" onSelect={onSelect}>
						<MagnifyingGlassIcon className="mr-2" />
						Test Task 3
					</CommandItem>
				</CommandGroup>
				{/* {tasks && tasks.length > 0 && (
					<CommandGroup heading="Tasks">
						{tasks.map((task) => (
							<CommandItem key={task._id} value={`/tasks/${task._id}`} onSelect={onSelect}>
								<MagnifyingGlassIcon className="mr-2" />
								{task.title}
							</CommandItem>
						))}
					</CommandGroup>
				)} */}
			</CommandList>
		</CommandDialog>
	);
}
