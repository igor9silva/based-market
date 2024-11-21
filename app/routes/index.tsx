import { createFileRoute, Link } from '@tanstack/react-router';
import { Grid } from '~/components/layout/Grid';
import { PageHeader } from '~/components/PageHeader';
import { TaskComposer } from '~/components/TaskComposer';
import { TaskList } from '~/components/TaskList';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '~/components/ui/breadcrumb';

export const Route = createFileRoute('/')({
	// TODO: poderia ter um loader para as tasks aqui, pensar um racional para decidir isso
	component: Inbox,
});

export default function Inbox() {
	return (
		<>
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
					<TaskComposer />
				</Grid.Side>
			</Grid>
		</>
	);
}
