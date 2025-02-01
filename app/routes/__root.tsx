import { useAuthActions } from '@convex-dev/auth/react';
import { QueryClient } from '@tanstack/react-query';
import { Outlet, ScrollRestoration, createRootRouteWithContext } from '@tanstack/react-router';
import { Meta, Scripts } from '@tanstack/start';
import { AuthLoading, Authenticated, Unauthenticated } from 'convex/react';
import * as React from 'react';
import { CommandMenuDialog } from '~/components/CommandMenu';

import { Loading } from '~/components/Loading';
import { MainHeader } from '~/components/MainHeader';
import { MainSidebar } from '~/components/MainSidebar';
import { Button } from '~/components/ui/button';
import { SidebarInset, SidebarProvider } from '~/components/ui/sidebar';
import { Toaster } from '~/components/ui/sonner';

import appCss from '~/styles/app.css?url';

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
		links: [
			{ rel: 'stylesheet', href: appCss },

			{ name: 'application-name', content: 'Meseeks' },
			{ name: 'apple-mobile-web-app-title', content: 'Meseeks' },

			// PWA Manifest
			{ rel: 'manifest', href: '/static/site.webmanifest' },

			// Theme Color
			{ name: 'theme-color', content: '#000000', media: '(prefers-color-scheme: dark)' },
			{ name: 'theme-color', content: '#ffffff', media: '(prefers-color-scheme: light)' },

			// Full screen mode
			{ name: 'mobile-web-app-capable', content: 'yes' },
			{ name: 'apple-mobile-web-app-capable', content: 'yes' },

			// Styling
			{ name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
			{ rel: 'apple-touch-icon', sizes: '180x180', href: '/static/logo-dark-192.png' },
		],
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
				<SidebarInset className="w-full h-svh overflow-hidden flex-col-reverse md:flex-col">
					<MainHeader className="h-12" />
					<div className="h-[calc(100%-3rem)]">{children}</div>
				</SidebarInset>
				<Toaster />
				<CommandMenuDialog />
			</Authenticated>
		</SidebarProvider>
	);
}

function AccessDenied() {
	//
	const { signIn } = useAuthActions();

	return (
		<div className="h-screen w-full flex flex-col items-center justify-center gap-4">
			<Button onClick={() => signIn('google', { redirectTo: location.href })}>Sign in</Button>
		</div>
	);
}

// TODO: on .webmanifest:
// show on chrome install
// "screenshots": [
//   {
//     "src": "screenshots/home.png",
//     "sizes": "1280x720",
//     "type": "image/png"
//   },
//   {
//     "src": "screenshots/settings.png",
//     "sizes": "1280x720",
//     "type": "image/png"
//   }
// ]

// SEO
// "categories": ["productivity", "utilities", "ai"]

// Define quick actions for users via long-press on the app icon (on supported devices).
// "shortcuts": [
//   {
//     "name": "New Task",
//     "short_name": "Task",
//     "description": "Create a new task instantly",
//     "url": "/new-task",
//     "icons": [{ "src": "icons/shortcut-task.png", "sizes": "192x192" }]
//   }
// ]

// other
// •	share_target: Lets your PWA receive shared content.
// •	protocol_handlers: Registers your app to handle custom URI schemes.
// •	file_handlers: Allows your PWA to open or handle specific file types.
// •	display_override: Overrides the display property with a fallback sequence.
// •	capture_links: Specifies how links to your domain should open (e.g., in-app).
// •	launch_handler: Manages how the app launches if it’s already open.
// •	prefer_related_applications and related_applications: Suggests native apps related to your PWA.
// •	iarc_rating_id: International Age Rating Coalition identifier for store listings.

// TODO: add SEO Tags, e.g. from TanStack
//     { title },
//     { name: 'description', content: description },
//     { name: 'keywords', content: keywords },
//     { name: 'twitter:title', content: title },
//     { name: 'twitter:description', content: description },
//     { name: 'twitter:creator', content: '@tannerlinsley' },
//     { name: 'twitter:site', content: '@tannerlinsley' },
//     { name: 'og:type', content: 'website' },
//     { name: 'og:title', content: title },
//     { name: 'og:description', content: description },
//     ...(image
//       ? [
//           { name: 'twitter:image', content: image },
//           { name: 'twitter:card', content: 'summary_large_image' },
//           { name: 'og:image', content: image },
//         ]
//       : []),
