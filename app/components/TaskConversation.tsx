import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc, Id } from 'convex/_generated/dataModel';
import { usePaginatedQuery } from 'convex/react';
import { MoveDown } from 'lucide-react';
import { RefCallback, useEffect, useMemo } from 'react';
import { StickToBottom, useStickToBottomContext } from 'use-stick-to-bottom';
import { Action } from '~/components/Action';
import { Loading } from '~/components/Loading';
import { MessageComposer } from '~/components/MessageComposer';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

const PAGE_SIZE = 20;
const NEAR_TOP_THRESHOLD = 200; // px

export function TaskConversation({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'>;
	className?: string;
}) {
	const taskQuery = convexQuery(api.tasks.public.findOne, { taskId });
	const { data: task } = useSuspenseQuery(taskQuery);

	const query = convexQuery(api.users.public.current, {});
	const { data: user } = useSuspenseQuery(query);

	const {
		results: actions,
		loadMore,
		status,
	} = usePaginatedQuery(
		api.action.public.findAllPaginated, //
		{ taskId: task._id },
		{ initialNumItems: PAGE_SIZE },
	);

	const reversedActions = useMemo(() => [...actions].reverse(), [actions]);
	const initialRenderDate = useMemo(() => new Date(), []);

	if (status === 'LoadingFirstPage') return <Loading />;

	return (
		<div className={cn('flex flex-col h-full', className)}>
			<StickToBottom mass={1} initial="instant" resize="instant" className="flex-1 overflow-auto">
				<StickToBottomContent actions={actions} status={status} loadMore={loadMore}>
					{reversedActions.map((action) => (
						<Action
							key={action._id}
							action={action}
							initialRenderDate={initialRenderDate}
							isAuthorCurrentUser={action.author === user._id}
						/>
					))}
				</StickToBottomContent>
			</StickToBottom>
			<MessageComposer task={task} className="flex-none bg-background/75 border-t" />
		</div>
	);
}

function StickToBottomContent({
	actions,
	status,
	loadMore,
	children,
}: {
	actions: Doc<'actions'>[];
	status: 'CanLoadMore' | 'LoadingMore' | 'Exhausted';
	loadMore: (n: number) => void;
	children: React.ReactNode;
}) {
	//
	const { isAtBottom, scrollToBottom, scrollRef } = useStickToBottomContext();
	const ref = scrollRef as RefCallback<HTMLDivElement> & { current: HTMLDivElement | null }; // type hack, comes odd from useStickToBottomContext

	// Infinite scroll, loads more when near the top TODO: abstract into a hook
	useEffect(() => {
		//
		const handleScroll = () => {
			//
			if (!ref.current) return;

			const isNearTop = ref.current.scrollTop < NEAR_TOP_THRESHOLD;

			// Workaround: force scrollTop to 1 if it's exactly 0.
			// When it is 0 and we get new events, the browser autoscroll to the new top.
			if (ref.current.scrollTop === 0) ref.current.scrollTop = 1;

			// Load more when near the top
			if (isNearTop && status === 'CanLoadMore') loadMore(PAGE_SIZE);
		};

		ref.current?.addEventListener('scroll', handleScroll);
		return () => ref.current?.removeEventListener('scroll', handleScroll);
		//
	}, [loadMore, status, scrollRef]);

	// Auto-scroll when new events are added and we're at the bottom
	useEffect(() => {
		//
		if (isAtBottom) scrollToBottom('smooth');
		//
	}, [actions.length, isAtBottom, scrollToBottom]);

	return (
		<StickToBottom.Content className="relative h-full">
			<div className="h-full">
				{status === 'LoadingMore' && (
					<div className="px-4 pt-4">
						<Loading className="h-6 w-fit" />
					</div>
				)}
				<div className="p-4 flex flex-col flex-grow justify-end gap-2">{children}</div>
				<div className="sticky bottom-2 flex flex-col">
					<ScrollToBottom />
				</div>
			</div>
		</StickToBottom.Content>
	);
}

function ScrollToBottom() {
	//
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();
	const onClick = () => scrollToBottom();

	return (
		!isAtBottom && (
			<div className="flex justify-center z-10">
				<Button variant="outline" className="p-1 size-5 [&_svg]:size-3 bg-background/75" onClick={onClick}>
					<MoveDown />
				</Button>
			</div>
		)
	);
}
