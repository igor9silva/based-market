import { createFileRoute } from '@tanstack/react-router';
import { Id } from 'convex/_generated/dataModel';
import { BasicError } from '~/components/BasicError';

import { TwoColumn } from '~/components/layout/TwoColumn';
import { TaskConversation } from '~/components/TaskConversation';
import TaskDetail from '~/components/TaskDetail';

export const Route = createFileRoute('/tasks_/$taskId')({
	component: TaskDetailPage,
	errorComponent: () => <BasicError text="Not found (or something else went wrong)." />,
});

function TaskDetailPage() {
	//
	const params = Route.useParams();
	const taskId = params.taskId as Id<'tasks'>;

	return (
		<div className="flex flex-col absolute h-full w-full overflow-hidden">
			{/* <PageHeader className="flex md:justify-start items-center">
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
			</PageHeader> */}
			<TwoColumn className="overflow-hidden flex-grow">
				<TaskConversation taskId={taskId} className="md:order-1 order-2" />
				<TaskDetail taskId={taskId} className="md:order-2 order-1" />
			</TwoColumn>
		</div>
	);
}
