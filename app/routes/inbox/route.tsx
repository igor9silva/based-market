import { createFileRoute } from '@tanstack/react-router';
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
		<div className="flex flex-col gap-4 m-4">
			<PageHeader>
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem>
							<BreadcrumbLink href="#">Inbox</BreadcrumbLink>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</PageHeader>
			<TaskList />
			<Separator />
			<TaskComposer />
		</div>
	);
}
