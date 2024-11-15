import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { formatDistanceToNow } from 'date-fns';
import { PageHeader } from '~/components/PageHeader';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Card, CardContent } from '~/components/ui/card';
export const Route = createFileRoute('/inbox_/$taskId')({
	component: Task,
});

export default function Task() {
	const { taskId } = Route.useParams();
	const query = convexQuery(api.tasks.findOne, { taskId: taskId as Id<'tasks'> });
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
			<Card className="m-4">
				<CardContent className="pt-6">
					<div className="space-y-1">
						<div className="flex items-start justify-between">
							<h3 className="font-semibold leading-none tracking-tight">{task.title}</h3>
							<span className="text-sm text-muted-foreground">
								{formatDistanceToNow(new Date(task._creationTime), { addSuffix: true })}
							</span>
						</div>
						{task.body && <p className="text-sm text-muted-foreground">{task.body}</p>}
					</div>
				</CardContent>
			</Card>
		</>
	);
}
