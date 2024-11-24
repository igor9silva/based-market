import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { Activity, Loader2, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { forwardRef, useRef, useState } from 'react';
import { TaskAction } from '~/components/TaskAction';
import { useClickOutside } from '~/hooks/useClickOutside';

const TRANSITION = { duration: 0.25, type: 'spring' };

export function ActionIsland({ task }: { task: Doc<'tasks'> }) {
	//
	const ref = useRef<HTMLDivElement>(null);
	const [isExpanded, setIsExpanded] = useState(false);

	const query = convexQuery(api.taskActions.findAll, { taskId: task._id });
	const { data: actions } = useSuspenseQuery(query);

	// if click outside, close
	useClickOutside(ref, () => setIsExpanded(false), isExpanded);

	return (
		<motion.div
			ref={ref}
			className="bg-secondary text-secondary-foreground rounded-lg cursor-pointer right-2 absolute overflow-hidden"
			transition={TRANSITION}
			initial={{
				top: 'auto',
			}}
			animate={{
				width: isExpanded ? '24rem' : 'auto',
				top: '0.5rem',
			}}
			onClick={() => !isExpanded && setIsExpanded(true)}
		>
			<AnimatePresence mode="popLayout">
				{isExpanded ? <Expanded actions={actions} /> : <Collapsed actions={actions} />}
			</AnimatePresence>
		</motion.div>
	);
}

const Expanded = forwardRef<HTMLDivElement, { actions: Doc<'taskActions'>[] }>(({ actions }, ref) => {
	return (
		<motion.div
			ref={ref}
			key="expanded"
			transition={TRANSITION}
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			className="max-h-[90dvh] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground/80 scrollbar-track-rounded-full scrollbar-thumb-rounded-full"
		>
			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-medium">Background Activity</h3>
					<span className="text-sm text-gray-400">{actions.length} actions</span>
				</div>
				<div className="space-y-3">
					{actions.map((action) => (
						<TaskAction key={action._id} action={action} />
					))}
				</div>
			</div>
		</motion.div>
	);
});
Expanded.displayName = 'Expanded';

const Collapsed = forwardRef<HTMLDivElement, { actions: Doc<'taskActions'>[] }>(({ actions }, ref) => {
	return (
		<div ref={ref} className="h-8 flex items-center justify-center gap-2 text-sm px-3 truncate">
			<CollapsedContent actions={actions} />
		</div>
	);
});
Collapsed.displayName = 'Collapsed';

const CollapsedContent = ({ actions }: { actions: Doc<'taskActions'>[] }) => {
	//
	const runningActions = actions.filter((action) => action.status === 'running');
	const pendingActions = actions.filter((action) => action.status === 'pending');
	const failedActions = actions.filter((action) => action.status === 'failed');

	if (runningActions.length > 0) {
		return (
			<>
				<Loader2 className="size-4 animate-spin" />
				<span>
					{runningActions.length} running{pendingActions.length > 0 && `, ${pendingActions.length} pending`}
				</span>
			</>
		);
	}

	if (failedActions.length > 0) {
		return (
			<>
				<X className="size-4" />
				<span>
					{failedActions.length} failed{pendingActions.length > 0 && `, ${pendingActions.length} pending`}
				</span>
			</>
		);
	}

	return (
		<>
			<Activity className="size-4" />
			{actions.length > 0 ? ( //
				<span>{actions.length} done</span>
			) : (
				<span>No activity</span>
			)}
		</>
	);
};
