import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';

import { ActionIsland } from '~/components/ActionIsland';
import { TwoColumn } from '~/components/layout/TwoColumn';
import { PageHeader } from '~/components/PageHeader';
import { TaskConversation } from '~/components/TaskConversation';
import TaskDetail from '~/components/TaskDetail';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';

export const Route = createFileRoute('/tasks_/$taskId')({
	component: TaskDetailPage,
	errorComponent: () => <div>Not found (or something else went wrong).</div>,
});

function TaskDetailPage() {
	//
	const params = Route.useParams();
	const taskId = params.taskId as Id<'tasks'>;

	const query = convexQuery(api.tasks.findOne, { taskId });
	const { data: task } = useSuspenseQuery(query);

	const parentQuery = convexQuery(api.tasks.findOneOrNot, { taskId: task?.parentId });
	const { data: parentTask } = useSuspenseQuery(parentQuery);

	return (
		<div className="flex flex-col absolute h-full w-full overflow-hidden">
			<PageHeader className="flex md:justify-start items-center">
				<Breadcrumb className="flex-grow">
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/$" params={{ _splat: parentTask?._id }}>
									{parentTask?.title ?? 'Inbox'}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link className="break-all" to={`/tasks/${taskId}`}>
									{task.title}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
				<ActionIsland task={task} className="right-2 z-20" />
			</PageHeader>
			<TwoColumn className="overflow-hidden flex-grow">
				<TaskConversation task={task} className="md:order-1 order-2" />
				<TaskDetail task={task} className="md:order-2 order-1" />
			</TwoColumn>
		</div>
	);
}
