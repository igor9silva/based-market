import { createFileRoute, Link } from '@tanstack/react-router';
import { PageHeader } from '~/components/PageHeader';
import { TaskComposer } from '~/components/TaskComposer';
import { TaskList } from '~/components/TaskList';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from '~/components/ui/breadcrumb';
import { Separator } from '~/components/ui/separator';

export const Route = createFileRoute('/inbox')({
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
								<Link to="/inbox">Inbox</Link>
							</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageHeader>
			<TaskList />
			<Separator />
			<TaskComposer />
		</>
	);
}
