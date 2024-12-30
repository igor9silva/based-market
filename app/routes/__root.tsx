import { useAuthActions } from '@convex-dev/auth/react';
import { QueryClient } from '@tanstack/react-query';
import { Outlet, ScrollRestoration, createRootRouteWithContext } from '@tanstack/react-router';
import { Meta, Scripts } from '@tanstack/start';
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react';
import * as React from 'react';

import { CommandMenu } from '~/components/CommandMenu';
import { Loading } from '~/components/Loading';
import { MainSidebar } from '~/components/MainSidebar';
import { Button } from '~/components/ui/button';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { Toaster } from '~/components/ui/sonner';

import appCss from '~/styles/app.css?url';
import thinkingEmojiUrl from '/static/thinking-emoji.gif';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	head: () => ({
		meta: [
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
				].join(','),
			},
		],
		links: [{ rel: 'stylesheet', href: appCss }],
	}),
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
		<html>
			<head>
				<Meta />
			</head>
			<body>
				<RootLayout>{children}</RootLayout>
				<ScrollRestoration />
				<Scripts />
				<Toaster />
				<CommandMenu />
			</body>
		</html>
	);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider open={false}>
			<AuthLoading>
				<Loading />
			</AuthLoading>
			<Unauthenticated>
				<AccessDenied />
			</Unauthenticated>
			<Authenticated>
				<MainSidebar />
				<SidebarInset className="w-full h-svh overflow-hidden">{children}</SidebarInset>
			</Authenticated>
		</SidebarProvider>
	);
}

function AccessDenied() {
	//
	const { signIn } = useAuthActions();
	const doSignIn = () => signIn('google');

	const isSpecial = typeof location !== 'undefined' && location.pathname !== '/saifora';

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center gap-4">
			{isSpecial ? (
				<>
					<p>Who the f are you?!</p>
					<img src={thinkingEmojiUrl} alt="Access denied" className="object-contain" />
				</>
			) : (
				<Button onClick={doSignIn}>Sign in</Button>
			)}
		</div>
	);
}
