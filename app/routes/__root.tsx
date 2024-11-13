import { QueryClient } from '@tanstack/react-query';
import { Outlet, ScrollRestoration, createRootRouteWithContext } from '@tanstack/react-router';
import { Body, Head, Html, Meta, Scripts } from '@tanstack/start';
import * as React from 'react';
import { MainSidebar } from '~/components/MainSidebar';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import appCss from '~/styles/app.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	meta: () => [
		{ title: 'Meseeks' },
		{ charSet: 'utf-8' },
		{
			name: 'viewport',
			content: [
				'width=device-width',
				'initial-scale=1',
				'minimum-scale=1',
				'maximum-scale=1',
				'user-scalable=no',
				'viewport-fit=cover',
			].join(', '),
		},
	],
	links: () => [{ rel: 'stylesheet', href: appCss }],
	component: RootComponent,
});

function RootComponent() {
	return (
		<RootDocument>
			<Outlet />
		</RootDocument>
	);
}

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<Html>
			<Head>
				<Meta />
			</Head>
			<Body>
				<RootLayout>{children}</RootLayout>
				<ScrollRestoration />
				<Scripts />
			</Body>
		</Html>
	);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider open={false}>
			<MainSidebar />
			<SidebarInset>{children}</SidebarInset>
		</SidebarProvider>
	);
}
