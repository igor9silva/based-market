import { ConvexQueryClient } from '@convex-dev/react-query';
import { QueryClient } from '@tanstack/react-query';
import { createRouter as createTanStackRouter } from '@tanstack/react-router';
import { routerWithQueryClient } from '@tanstack/react-router-with-query';
import { ConvexProvider, ConvexReactClient } from 'convex/react';

import { DefaultCatchBoundary } from './components/DefaultCatchBoundary';
import { NotFound } from './components/NotFound';
import { routeTree } from './routeTree.gen';

export function createRouter() {
	const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL as string; // TODO: use typed env
	if (!CONVEX_URL) throw new Error('missing VITE_CONVEX_URL envar');

	const convex = new ConvexReactClient(CONVEX_URL, {
		unsavedChangesWarning: false,
	});

	const convexQueryClient = new ConvexQueryClient(convex);
	const queryClient: QueryClient = new QueryClient({
		defaultOptions: {
			queries: {
				queryKeyHashFn: convexQueryClient.hashFn(),
				queryFn: convexQueryClient.queryFn(),
			},
		},
	});

	convexQueryClient.connect(queryClient);

	const router = routerWithQueryClient(
		createTanStackRouter({
			routeTree,
			defaultPreload: 'intent',
			defaultPreloadDelay: 50, // 50ms is the default, just making it explicit here
			defaultPreloadStaleTime: 0, // 0 so we don't cache at the loader level, leaving it all to TanStack Query
			defaultErrorComponent: DefaultCatchBoundary,
			defaultNotFoundComponent: () => <NotFound />,
			context: { queryClient },
			Wrap: ({ children }) => {
				return (
					<ConvexProvider client={convexQueryClient.convexClient}>
						{children}
					</ConvexProvider>
				);
			},
		}),
		queryClient,
	);

	return router;
}

declare module '@tanstack/react-router' {
	interface Register {
		router: ReturnType<typeof createRouter>;
	}
}
