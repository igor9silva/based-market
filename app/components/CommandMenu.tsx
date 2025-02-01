import { useLocation, useNavigate } from '@tanstack/react-router';
import { defaultFilter, useCommandState } from 'cmdk';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useQuery } from 'convex/react';
import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { Circle, CircleCheckBig, CirclePlus, DollarSign, Inbox } from 'lucide-react';
import {
	CommandDialog,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandLoading,
} from '~/components/ui/command';
import { DialogDescription, DialogTitle } from '~/components/ui/dialog';
import { useSplatParams } from '~/hooks/useSplatParams';
import { useTaskMutations } from '~/hooks/useTaskMutations';

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
	const { pathname, searchStr } = useLocation();
	const navigate = useNavigate();

	const [search, setSearch] = useState(pathname + searchStr);

	useEffect(() => {
		setSearch(pathname + searchStr);
	}, [pathname, searchStr]);

	const shouldFilter = useMemo(() => {
		return search !== pathname + searchStr;
	}, [search, pathname, searchStr]);

	const onSelect = useCallback(
		(value: string) => {
			close();
			navigate({ to: value });
		},
		[navigate, close],
	);

	const tasks = useQuery(api.tasks.public.findAll, {}); // TODO: server-side search
	const { taskId: currentTaskId } = useSplatParams();

	return (
		<CommandDialog
			shouldFilter={shouldFilter}
			open={isOpen}
			onOpenChange={close}
			filter={(value, search, keywords) => {
				//
				const result = defaultFilter?.(value, search, keywords) ?? 0;

				if (value === '/new') return result + 0.0000001; // make sure new task is always included

				return result;
			}}
		>
			<DialogTitle className="hidden">Global command menu</DialogTitle>
			<DialogDescription className="hidden">Search for tasks, notes, files, and more.</DialogDescription>
			<CommandInput placeholder="Act or search..." value={search} onValueChange={setSearch} />
			<CommandList>
				{/* Quick actions */}
				<CommandGroup heading="Quick actions">
					<NewTaskCommandItem shouldUseSearch={shouldFilter} />
					{currentTaskId && <MarkAsDoneCommandItem taskId={currentTaskId} />}
				</CommandGroup>

				{/* Pinned tasks */}
				<CommandGroup heading="Pinned tasks">
					<CommandItem value="/" keywords={['inbox']} onSelect={onSelect}>
						<Inbox className="mr-2" />
						Inbox
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

				{/* All tasks */}
				<CommandGroup heading="All tasks">
					{!tasks && <CommandLoading>Fetching tasks</CommandLoading>}
					{tasks?.map((task) => {
						return (
							<CommandItem
								key={task._id}
								value={`/chat/${task._id}`}
								keywords={[task.title ?? 'Untitled task']}
								onSelect={onSelect}
							>
								{task.isDone ? <CircleCheckBig className="mr-2" /> : <Circle className="mr-2" />}
								<span className={task.isDone ? 'line-through' : ''}>
									{task.title ?? 'Untitled task'}
								</span>
							</CommandItem>
						);
					})}
				</CommandGroup>
			</CommandList>
		</CommandDialog>
	);
}

function MarkAsDoneCommandItem({ taskId }: { taskId: Id<'tasks'> }) {
	//
	const { close } = useCommandMenu();
	const { markAsDone } = useTaskMutations();

	const currentTask = useQuery(api.tasks.public.findOne, { taskId });
	if (!currentTask) return null;

	const handleSelect = useCallback(() => {
		markAsDone({ taskId: currentTask._id, isDone: !currentTask.isDone });
		close();
	}, [markAsDone, currentTask._id, close]);

	return (
		<CommandItem keywords={['mark', 'as done', 'as not done']} onSelect={handleSelect}>
			{currentTask.isDone ? <Circle className="mr-2" /> : <CircleCheckBig className="mr-2" />}
			{currentTask.isDone ? 'Unmark' : 'Mark'} as done
		</CommandItem>
	);
}

function NewTaskCommandItem({ shouldUseSearch }: { shouldUseSearch: boolean }) {
	//
	const { close } = useCommandMenu();
	const navigate = useNavigate();

	const typedSearch = useCommandState((state) => state.search);

	const search = useMemo(() => {
		if (!shouldUseSearch) return '';
		return typedSearch;
	}, [shouldUseSearch, typedSearch]);

	const handleSelect = useCallback(() => {
		navigate({ to: '/$', params: { _splat: '/new' }, search: { newTaskText: search } });
		close();
	}, [navigate, close, search]);

	return (
		<CommandItem value="/new" keywords={['new', 'task', search]} onSelect={handleSelect}>
			<CirclePlus className="mr-2" />
			{search ? `New task with "${search}"` : 'New task'}
		</CommandItem>
	);
}
