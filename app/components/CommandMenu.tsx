import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { useNavigate } from '@tanstack/react-router';
import { DollarSign, Inbox, Plus } from 'lucide-react';
import * as React from 'react';

import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from '~/components/ui/command';

interface CommandMenuContextType {
	isOpen: boolean;
	open: () => void;
	close: () => void;
}

const CommandMenuContext = React.createContext<CommandMenuContextType | null>(null);

export function useCommandMenu() {
	//
	const context = React.useContext(CommandMenuContext);

	if (!context) {
		throw new Error('useCommandMenu must be used within CommandMenuProvider');
	}

	return context;
}

export function CommandMenuProvider({ children }: { children: React.ReactNode }) {
	//
	const [isOpen, setIsOpen] = React.useState(false);

	const value = React.useMemo(
		() => ({
			isOpen,
			open: () => setIsOpen(true),
			close: () => setIsOpen(false),
		}),
		[isOpen],
	);

	React.useEffect(() => {
		//
		const down = (e: KeyboardEvent) => {
			//
			if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
				e.preventDefault();
				setIsOpen((open) => !open);
			}
		};

		document.addEventListener('keydown', down);
		return () => document.removeEventListener('keydown', down);
		//
	}, []);

	return <CommandMenuContext.Provider value={value}>{children}</CommandMenuContext.Provider>;
}

export function CommandMenuDialog() {
	//
	const { isOpen, close } = useCommandMenu();
	const navigate = useNavigate();

	const onSelect = React.useCallback(
		(value: string) => {
			close();
			navigate({ to: value as any });
		},
		[navigate, close],
	);

	return (
		<CommandDialog open={isOpen} onOpenChange={close}>
			<CommandInput placeholder="Type a command or search..." />
			<CommandList>
				<CommandEmpty>No results found.</CommandEmpty>
				{/* <CommandSeparator /> */}
				<CommandGroup heading="Sidebar">
					<CommandItem value="/new" keywords={['new', 'task']} onSelect={onSelect}>
						<Plus className="mr-2" />
						New Task
					</CommandItem>
					<CommandItem value="/" keywords={['inbox']} onSelect={onSelect}>
						{/* <Link to="/$" params={{ _splat: '' }}> */}
						<Inbox className="mr-2" />
						Inbox
						{/* </Link> */}
					</CommandItem>
					<CommandItem
						value="/list/kh70vk1fpyg3mkf0jg1wmeerg9768ngv"
						keywords={['finances']}
						onSelect={onSelect}
					>
						<DollarSign className="mr-2" />
						Finances
					</CommandItem>
				</CommandGroup>
				<CommandSeparator />
				<CommandGroup heading="Pinned Tasks">
					<CommandItem
						value="/chat/kh73ekz89d5awan6pejdwdp5v176690k"
						keywords={['test', 'task', 'pinned', 'task 1']}
						onSelect={onSelect}
					>
						<MagnifyingGlassIcon className="mr-2" />
						Test Task 1
					</CommandItem>
					<CommandItem
						value="/chat/kh753rpp5dz4pn4zc8x2jdz3cs763kp1"
						keywords={['test', 'task', 'pinned', 'task 2']}
						onSelect={onSelect}
					>
						<MagnifyingGlassIcon className="mr-2" />
						Test Task 2
					</CommandItem>
					<CommandItem
						value="/chat/kh78yn9ffq0ph7g5cgqmh482a9763de2"
						keywords={['test', 'task', 'pinned', 'task 3']}
						onSelect={onSelect}
					>
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
