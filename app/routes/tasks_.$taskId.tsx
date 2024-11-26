import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { ActionIsland } from '~/components/ActionIsland';
import { TwoColumn } from '~/components/layout/TwoCollumn';
import { PageHeader } from '~/components/PageHeader';
import TaskDetail from '~/components/TaskDetail';
import { TaskEvents } from '~/components/TaskEvents';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';

export const Route = createFileRoute('/tasks_/$taskId')({
	component: TaskDetailPage,
	errorComponent: () => <div>Task not found or something else went wrong.</div>,
});

function TaskDetailPage() {
	//
	const params = Route.useParams();
	const taskId = params.taskId as Id<'tasks'>;

	const query = convexQuery(api.tasks.findOne, { taskId });
	const { data: task } = useSuspenseQuery(query);

	return (
		<>
			<PageHeader className="flex justify-between items-center">
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/">Inbox</Link>
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
				<ActionIsland task={task} />
			</PageHeader>
			<TwoColumn>
				<TaskDetail task={task} />
				<TaskEvents task={task} />
			</TwoColumn>
		</>
	);
}
