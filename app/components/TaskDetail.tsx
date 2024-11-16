import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { FillTaskButton } from '~/components/FillTaskButton';
import { MinifyTaskButton } from '~/components/MinifyTaskButton';
import { PageHeader } from '~/components/PageHeader';
import { TaskActionList } from '~/components/TaskActionList';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Card, CardContent, CardFooter } from '~/components/ui/card';
import { Route } from '~/routes/inbox_.$taskId';

export default function TaskDetail() {
	//
	const params = Route.useParams();
	const taskId = params.taskId as Id<'tasks'>;

	const query = convexQuery(api.tasks.findOne, { taskId });
	const { data: task } = useSuspenseQuery(query);

	return (
		<>
			<PageHeader>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/inbox">Inbox</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator />
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to={`/inbox/${taskId}`}>{task.title}</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageHeader>
			<Card className="whitespace-pre-wrap">
				<CardContent className="pt-6">
					<div className="space-y-1">
						<div className="flex items-start justify-between">
							<h1 className="text-2xl font-bold leading-none tracking-tight">{task.title}</h1>
							<span className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(task._creationTime), { addSuffix: true })}
							</span>
						</div>
						{task.body && <p className="text-sm text-muted-foreground">{task.body}</p>}
					</div>
				</CardContent>
				<CardFooter className="flex gap-2">
					<FillTaskButton task={task} />
					<MinifyTaskButton task={task} />
				</CardFooter>
			</Card>
			<Card className="whitespace-pre-wrap">
				<CardContent className="pt-6">
					<h3 className="text-md font-semibold">Action Queue</h3>
					<TaskActionList task={task} />
				</CardContent>
			</Card>
		</>
	);
}
