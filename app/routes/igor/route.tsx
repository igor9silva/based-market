import { useAuthActions } from '@convex-dev/auth/react';
import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '~/components/ui/breadcrumb';
import { Button } from '~/components/ui/button';
import { Separator } from '~/components/ui/separator';
import { SidebarTrigger } from '~/components/ui/sidebar';

const query = convexQuery(api.users.currentUser, {});

export const Route = createFileRoute('/igor')({
	loader: async ({ context }) => {
		context.queryClient.prefetchQuery(query);
		// await context.queryClient.ensureQueryData(query);
	},
	component: Component,
});

function Component() {
	const { signIn, signOut } = useAuthActions();
	const { data: user } = useSuspenseQuery(query);

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
			{user ? (
				<Button className="p-2 m-2" onClick={() => signOut()}>
					Welcome back, {user.name}! Sign out
				</Button>
			) : (
				<Button className="p-2 m-2" onClick={() => signIn('google', { redirectTo: location.href })}>
					Sign in
				</Button>
			)}
			<div className="flex flex-1 flex-col gap-4 p-4">
				{Array.from({ length: 24 }).map((_, index) => (
					<div key={index} className="h-12 w-full rounded-lg bg-muted/50" />
				))}
			</div>
		</>
	);
}
