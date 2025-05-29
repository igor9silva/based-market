import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { z } from 'zod';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';
import { TextShimmer } from '~/components/ui/text-shimmer';

export const Route = createFileRoute('/games/orbital-flux_/$id')({
	component: RouteComponent,
	validateSearch: z.object({
		isExpanded: z.boolean().optional(),
	}),
});

function RouteComponent() {
	//
	const { id } = Route.useParams();
	const gameId = id as Id<'games'>;

	console.log('Specific game route loaded with ID:', id);

	// fetch game data from backend
	const query = convexQuery(api.games.public.get, { gameId });
	const { data: game } = useSuspenseQuery(query);

	console.log('Game data:', game);

	// show loading state while data is loading
	if (game === undefined) {
		return (
			<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
				<div className="text-center">
					<TextShimmer text="Loading game" className="text-lg" />
				</div>
			</div>
		);
	}

	// handle game not found
	if (game === null) {
		return (
			<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
				<div className="text-center">
					<p className="text-muted-foreground">Game not found</p>
				</div>
			</div>
		);
	}

	// render the game with backend integration
	return (
		<div className="h-screen overflow-hidden">
			<OrbitalFlux gameId={gameId} enablePerks={true} showStats={true} />
		</div>
	);
}
