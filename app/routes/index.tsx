import { createFileRoute, Link } from '@tanstack/react-router';
import { Grid } from '~/components/layout/Grid';
import { PageHeader } from '~/components/PageHeader';
import { QuickAdd } from '~/components/QuickAdd';
import { TaskList } from '~/components/TaskList';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '~/components/ui/breadcrumb';

export const Route = createFileRoute('/')({
	component: Inbox,
});

export default function Inbox() {
	return (
		<div>
			<PageHeader>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link to="/">Inbox</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageHeader>
			<Grid>
				<Grid.Main>
					<TaskList />
				</Grid.Main>
				<Grid.Side>
					<QuickAdd />
				</Grid.Side>
			</Grid>
		</div>
	);
}
