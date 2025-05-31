import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { z } from 'zod';
import { gameRegistry } from '~/lib/games';
import { Loading } from '~/components/Loading';

export const Route = createFileRoute('/games/$gameSlug/$gameId')({
	component: RouteComponent,
	validateSearch: z.object({
		isExpanded: z.boolean().optional(),
	}),
});

function RouteComponent() {
	//
	const { gameSlug, gameId } = Route.useParams();
	const gameDefinition = gameRegistry.getGame(gameSlug);
	const game = useQuery(api.games.public.get, { gameId });

	if (!gameDefinition) {
		return (
			<div className="h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-destructive mb-2">Game Not Found</h1>
					<p className="text-muted-foreground">The game "{gameSlug}" is not available.</p>
				</div>
			</div>
		);
	}

	if (game === undefined) {
		return <Loading />;
	}

	if (game === null) {
		return (
			<div className="h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<h1 className="text-2xl font-bold text-destructive mb-2">Game Not Found</h1>
					<p className="text-muted-foreground">Game ID "{gameId}" does not exist.</p>
				</div>
			</div>
		);
	}

	const { GameComponent } = gameDefinition.components;

	return (
		<GameComponent
			gameId={gameId}
			config={game.config}
			mode="playing"
			enablePerks={false}
			showStats={true}
			autoStart={false}
			showSidebarToggle={true}
			hideGameControls={false}
		/>
	);
}