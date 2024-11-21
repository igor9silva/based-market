import { Activity, Check, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useState } from 'react';

interface Task {
	id: string;
	title: string;
	status: 'running' | 'completed' | 'error';
	timestamp: string;
}

const TRANSITION = { duration: 0.25, type: 'spring' };

export function ActionIsland() {
	//
	const [isExpanded, setIsExpanded] = useState(false);
	const [tasks, setTasks] = useState<Task[]>([
		{ id: '1', title: 'Uploading files...', status: 'running', timestamp: 'Just now' },
		{ id: '2', title: 'Task completed', status: 'completed', timestamp: '2m ago' },
	]);

	return (
		<motion.div
			className="bg-secondary text-secondary-foreground rounded-lg cursor-pointer right-2 absolute"
			transition={TRANSITION}
			initial={{
				top: 'auto',
			}}
			animate={{
				width: isExpanded ? '24rem' : 'auto',
				top: '0.5rem',
			}}
			onClick={() => setIsExpanded(!isExpanded)}
		>
			<AnimatePresence mode="popLayout">
				{isExpanded ? <Expanded tasks={tasks} /> : <Collapsed tasks={tasks} />}
			</AnimatePresence>
		</motion.div>
	);
}

function Expanded({ tasks }: { tasks: Task[] }) {
	return (
		<motion.div
			key="expanded"
			transition={TRANSITION}
			initial={{ opacity: 0, height: 0 }}
			animate={{ opacity: 1, height: 'auto' }}
			className="overflow-hidden"
		>
			<div className="p-4">
				<div className="flex items-center justify-between mb-4">
					<h3 className="font-medium">Background Tasks</h3>
					<span className="text-sm text-gray-400">{tasks.length} active</span>
				</div>
				<div className="space-y-3">
					{tasks.map((task) => (
						<div key={task.id} className="flex items-center justify-between text-sm">
							<div className="flex items-center gap-2">
								{task.status === 'running' ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Check className="w-4 h-4" />
								)}
								<span>{task.title}</span>
							</div>
							<span className="text-xs text-gray-400">{task.timestamp}</span>
						</div>
					))}
				</div>
			</div>
		</motion.div>
	);
}

function Collapsed({ tasks }: { tasks: Task[] }) {
	return (
		<motion.div
			key="collapsed"
			transition={TRANSITION}
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="h-8 flex items-center justify-center gap-2 text-sm px-3 truncate"
		>
			<Activity className="size-4" />
			<span>{tasks.length} active</span>
		</motion.div>
	);
}
