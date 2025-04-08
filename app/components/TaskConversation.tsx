import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, useSearch } from "@tanstack/react-router";
import { api } from "convex/_generated/api";
import type { Doc, Id } from "convex/_generated/dataModel";
import { usePaginatedQuery } from "convex/react";
import { Bug, ChevronDown } from "lucide-react";
import { type RefCallback, useEffect, useMemo, useState } from "react";
import { StickToBottom, useStickToBottomContext } from "use-stick-to-bottom";
import { Action } from "~/components/Action";
import { ActionComposer } from "~/components/ActionComposer";
import { DebugAction } from "~/components/DebugAction";
import { Loading } from "~/components/Loading";
import { Button } from "~/components/ui/button";
import { Toggle } from "~/components/ui/toggle";
import { useCurrentUser } from "~/hooks/useCurrentUser";
import { cn } from "~/lib/utils";

const PAGE_SIZE = 35;
const NEAR_TOP_THRESHOLD = 200; // px

export function TaskConversation({
	taskId, //
	className,
}: {
	taskId: Id<"tasks">;
	className?: string;
}) {
	const taskQuery = convexQuery(api.tasks.public.findOne, { taskId });
	const { data: task } = useSuspenseQuery(taskQuery);
	const { debug } = useSearch({ strict: false });

	const user = useCurrentUser();

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

	if (status === "LoadingFirstPage" && actions.length === 0) return <Loading />;

	return (
		<div className={cn("flex flex-col h-full p-2 gap-2", className)}>
			<div className="flex justify-end bg-background/75">
				<Link to="/$" search={{ debug: debug ? undefined : true }} replace>
					<Toggle
						aria-label="Toggle debug mode"
						pressed={Boolean(debug)}
						className="h-8 px-2 data-[state=on]:bg-primary/10 data-[state=on]:text-primary"
					>
						<Bug className="h-4 w-4 mr-1" />
						Debug
					</Toggle>
				</Link>
			</div>
			<StickToBottom
				mass={1}
				initial="instant"
				resize="instant"
				className="flex-1 overflow-auto"
			>
				<StickToBottomContent
					actions={actions}
					status={status}
					loadMore={loadMore}
				>
					{reversedActions.map((action) =>
						debug ? (
							<DebugAction
								key={action._id}
								action={action}
								initialRenderDate={initialRenderDate}
								isAuthorCurrentUser={action.author === user._id}
								taskId={taskId}
							/>
						) : (
							<Action
								key={action._id}
								action={action}
								initialRenderDate={initialRenderDate}
								isAuthorCurrentUser={action.author === user._id}
								taskId={taskId}
							/>
						),
					)}
				</StickToBottomContent>
			</StickToBottom>
			<ActionComposer task={task} />
		</div>
	);
}

function StickToBottomContent({
	actions,
	status,
	loadMore,
	children,
}: {
	actions: Doc<"actions">[];
	status: "CanLoadMore" | "LoadingMore" | "Exhausted" | "LoadingFirstPage";
	loadMore: (n: number) => void;
	children: React.ReactNode;
}) {
	//
	const { isAtBottom, scrollToBottom, scrollRef } = useStickToBottomContext();
	const ref = scrollRef as RefCallback<HTMLDivElement> & {
		current: HTMLDivElement | null;
	}; // type hack, comes odd from useStickToBottomContext

	const [isLoaded, setIsLoaded] = useState(false);

	useEffect(() => {
		if (isLoaded) return;
		if (actions.length > 0) setIsLoaded(true);
	}, [actions.length, isLoaded]);

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
			if (isNearTop && status === "CanLoadMore") loadMore(PAGE_SIZE);
		};

		ref.current?.addEventListener("scroll", handleScroll);
		return () => ref.current?.removeEventListener("scroll", handleScroll);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadMore, status, ref.current]);

	// Auto-scroll when new events are added and we're at the bottom
	useEffect(() => {
		//
		if (isAtBottom && actions.length > 0) {
			setTimeout(() => scrollToBottom(isLoaded ? 'smooth' : 'instant'), 100);
		}
		//
	}, [actions.length, isAtBottom, isLoaded, scrollToBottom]);

	return (
		<StickToBottom.Content className="relative h-full p-2">
			<div className="h-full">
				{status === "LoadingMore" && (
					<div className="px-4 pt-4">
						<Loading className="h-6 w-fit" />
					</div>
				)}
				<div className="flex flex-col flex-grow justify-end gap-2">
					{children}
				</div>
				<div className="sticky bottom-2 flex flex-col">
					<ScrollToBottom />
				</div>
			</div>
		</StickToBottom.Content>
	);
}

function ScrollToBottom({ className }: { className?: string }) {
	//
	const { isAtBottom, scrollToBottom } = useStickToBottomContext();
	const onClick = () => scrollToBottom();

	return (
		!isAtBottom && (
			<div className="flex justify-center z-10">
				<Button
					variant="outline"
					size="icon"
					className={cn(
						"h-8 w-8 rounded-full transition-all duration-150 ease-out",
						"translate-y-0 scale-100 opacity-100",
						className,
					)}
					onClick={onClick}
				>
					<ChevronDown className="size-4" />
				</Button>
			</div>
		)
	);
}
