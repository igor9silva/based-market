import { createFileRoute } from '@tanstack/react-router';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';

export const Route = createFileRoute('/igor')({
	component: Component,
});

function Component() {
	return (
		<>
			<header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4 rounded-tl-lg rounded-tr-lg">
				<SidebarTrigger className="-ml-1 md:hidden" />
				<Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
				<Breadcrumb>
					<BreadcrumbList>
						<BreadcrumbItem className="hidden md:block">
							<BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
						</BreadcrumbItem>
						<BreadcrumbSeparator className="hidden md:block" />
						<BreadcrumbItem>
							<BreadcrumbPage>Inbox</BreadcrumbPage>
						</BreadcrumbItem>
					</BreadcrumbList>
				</Breadcrumb>
			</header>
			<div className="flex flex-1 flex-col gap-4 p-4">
				{Array.from({ length: 24 }).map((_, index) => (
					<div key={index} className="h-12 w-full rounded-lg bg-muted/50" />
				))}
			</div>
		</>
	);
}
