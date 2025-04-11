import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useCallback } from 'react';
import { cn } from '~/lib/utils';

import { QuickAdd } from '~/components/QuickAdd';
import { TaskConversation } from '~/components/TaskConversation';
import TaskDetail from '~/components/TaskDetail';
import { TaskItem } from '~/components/TaskItem';
import { TaskDetailAndConversation } from '~/components/layout/TaskDetailAndConversation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useDebounce } from '~/hooks/useDebounce';
import { useIsMobile } from '~/hooks/useIsMobile';
import { useTaskMutations } from '~/hooks/useTaskMutations';

export function TaskListAndDetail({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'> | 'inbox';
	className?: string;
}) {
	const args = taskId === 'inbox' ? {} : { parentId: taskId };
	const query = convexQuery(api.tasks.public.findAll, args);
	const { data: subtasks } = useSuspenseQuery(query);

	const preferencesQuery = convexQuery(api.users.preferences.public.getPreferences, {});
	const { data: preferences } = useSuspenseQuery(preferencesQuery);

	const { selectedSubtaskId } = useSearch({ strict: false });

	const detailWidthPercent = preferences.inboxDetailWidthPercent ?? 70;

	const isMobile = useIsMobile();
	const direction = isMobile ? 'vertical' : 'horizontal';

	const { setInboxDetailWidthPercent } = useTaskMutations();

	const debouncedSetWidth = useDebounce((widthPercent: number) => {
		if (!widthPercent) return;
		setInboxDetailWidthPercent({ widthPercent });
	}, 500);

	const handleLayoutChange = useCallback(
		(sizes: number[]) => {
			debouncedSetWidth(sizes[1]);
		},
		[debouncedSetWidth],
	);

	return (
		<ResizablePanelGroup
			direction={direction}
			onLayout={handleLayoutChange}
			className={cn('overflow-hidden', className)}
		>
			<ResizablePanel id="list" order={0} defaultSize={100 - (selectedSubtaskId ? detailWidthPercent : 0)}>
				<div className="overflow-auto h-full">
					<QuickAdd />
					{subtasks.map((task) => (
						<Link
							key={task._id}
							to="/$"
							search={{ selectedSubtaskId: selectedSubtaskId === task._id ? undefined : task._id }}
							resetScroll={false}
						>
							<TaskItem className={cn(selectedSubtaskId === task._id && 'bg-muted')} task={task} />
						</Link>
					))}
				</div>
			</ResizablePanel>
			{selectedSubtaskId && <ResizableHandle withHandle />}
			{selectedSubtaskId && (
				<ResizablePanel id="detail" order={1} defaultSize={detailWidthPercent}>
					<TaskDetailAndConversation
						defaultListSize={50}
						list={<TaskDetail taskId={selectedSubtaskId} />}
						detail={<TaskConversation taskId={selectedSubtaskId} />}
					/>
				</ResizablePanel>
			)}
		</ResizablePanelGroup>
	);
}
