import { createFileRoute } from '@tanstack/react-router';
import { zid } from 'convex-helpers/server/zod';
import { Id } from 'convex/_generated/dataModel';
import { z } from 'zod';
import { BasicError } from '~/components/BasicError';
import { Grid } from '~/components/layout/Grid';
import { QuickAdd } from '~/components/QuickAdd';
import { TaskList } from '~/components/TaskList';

const searchSchema = z.object({
	selectedSubtaskId: zid('tasks').optional(),
});

export const Route = createFileRoute('/$')({
	component: TaskListPage,
	errorComponent: () => <BasicError text="Not found (or something else went wrong)." />,
	validateSearch: searchSchema,
});

export default function TaskListPage() {
	//
	// get the task from URL, defaults to Inbox (no parent)
	const { _splat } = Route.useParams();
	const parts = _splat?.split('/') ?? [];

	// /page or /page/taskId - else throw
	if (parts.length < 1 || parts.length > 2) {
		throw new Error('Invalid URL');
	}

	// get the task from URL, defaults to Inbox (no parent)
	const pageSlug = parts.at(0) as string; // TODO: Id<'pages'>
	const taskId = parts.at(1) as Id<'tasks'> | undefined;

	return (
		<div>
			{/* <PageHeader>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/$" params={{ _splat: taskId }}>
									{task?.title ?? 'Inbox'}
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageHeader> */}
			<Grid>
				<Grid.Main>
					<QuickAdd />
				</Grid.Main>
				<Grid.Side>
					<TaskList taskId={taskId ?? 'inbox'} />
				</Grid.Side>
			</Grid>
		</div>
	);
}
