import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { Grid } from '~/components/layout/Grid';
import { PageHeader } from '~/components/PageHeader';
import { QuickAdd } from '~/components/QuickAdd';
import { TaskList } from '~/components/TaskList';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '~/components/ui/breadcrumb';

export const Route = createFileRoute('/$')({
	component: TaskListPage,
	errorComponent: () => <div>Not found (or something else went wrong).</div>,
});

export default function TaskListPage() {
	//
	// get the parent task from URL, defaults to Inbox
	const { _splat } = Route.useParams();
	const firstPart = _splat?.split('/').pop();
	const parentId = firstPart ? (firstPart as Id<'tasks'>) : undefined;

	const query = convexQuery(api.tasks.findOneOrNot, { taskId: parentId });
	const { data: task } = useSuspenseQuery(query);

	return (
		<div>
			<PageHeader>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/$" params={{ _splat: parentId }}>
									{task?.title ?? 'Inbox'}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageHeader>
			<Grid>
				<Grid.Main>
					<QuickAdd />
				</Grid.Main>
				<Grid.Side>
					<TaskList parentId={parentId} />
				</Grid.Side>
			</Grid>
		</div>
	);
}
