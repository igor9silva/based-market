import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { taskStatusSchema } from 'convex/schemas/taskSchema';
import { z } from 'zod';
import { StatusIndicator } from '~/components/StatusIndicator';
import { cn } from '~/lib/utils';

const classMap: Record<z.infer<typeof taskStatusSchema>, string> = {
	idle: 'hidden',
	unread: 'bg-blue-500',
	acting: 'bg-green-500 animate-pulse-blur',
	blocked: 'bg-orange-700',
	done: 'hidden',
	discarded: 'hidden',
};

export const TaskStatusIndicator = ({
	taskId, //
	className,
}: {
	taskId: Id<'tasks'>;
	className?: string;
}) => {
	//
	const query = convexQuery(api.tasks.public.findOne, { taskId });
	const { data: task } = useSuspenseQuery(query);

	return <StatusIndicator className={cn(classMap[task.status], className)} />;
};
