import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { Activity } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useRef, useState } from 'react';
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

function Expanded({ actions }: { actions: Doc<'taskActions'>[] }) {
	return (
		<motion.div
			key="expanded"
			transition={TRANSITION}
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			className="max-h-[90dvh] overflow-y-auto scrollbar-thin scrollbar-track-muted/20 scrollbar-thumb-muted-foreground/50 hover:scrollbar-thumb-muted-foreground/80 scrollbar-track-rounded-full scrollbar-thumb-rounded-full"
		>
			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-medium">Background Tasks</h3>
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
}

function Collapsed({ actions }: { actions: Doc<'taskActions'>[] }) {
	return (
		<motion.div
			key="collapsed"
			transition={TRANSITION}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="h-8 flex items-center justify-center gap-2 text-sm px-3 truncate"
		>
			<Activity className="size-4" />
			<span>{actions.length} actions</span>
		</motion.div>
	);
}
