import { useAuthActions } from '@convex-dev/auth/react';
import { QueryClient } from '@tanstack/react-query';
import { Outlet, ScrollRestoration, createRootRouteWithContext } from '@tanstack/react-router';
import { Body, Head, Html, Meta, Scripts } from '@tanstack/start';
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react';
import * as React from 'react';
import { MainSidebar } from '~/components/MainSidebar';
import { Button } from '~/components/ui/button';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import thinkingEmojiUrl from '~/static/thinking-emoji.gif';
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
			<AuthLoading>Loading...</AuthLoading>
			<Authenticated>
				<MainSidebar />
				<SidebarInset>{children}</SidebarInset>
			</Authenticated>
			<Unauthenticated>
				<AccessDenied />
			</Unauthenticated>
		</SidebarProvider>
	);
}

function AccessDenied() {
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
