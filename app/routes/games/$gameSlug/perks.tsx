import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { gameRegistry } from '~/lib/games';
import { Loading } from '~/components/Loading';

export const Route = createFileRoute('/games/$gameSlug/perks')({
	component: RouteComponent,
});

function RouteComponent() {
	//
	const { gameSlug } = Route.useParams();
	const gameDefinition = gameRegistry.getGame(gameSlug);
	const currentGame = useQuery(api.games.public.getCurrentLiveGame);

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

	// show loading state
	if (currentGame === undefined) {
		return <Loading />;
	}

	// show no live game state
	if (currentGame === null) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">There's no game currently running live.</p>
				</div>
			</div>
		);
	}

	// check if this game has a perks panel
	if (!gameDefinition.components.PerksPanel) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">
						This game does not support perks.
					</p>
				</div>
			</div>
		);
	}

	const { PerksPanel } = gameDefinition.components;

	return (
		<div className="min-h-screen bg-background">
			{/* header */}
			<div className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-6">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold">Purchase Perks</h1>
						<p className="text-muted-foreground">
							Purchase perks for the live {gameDefinition.metadata.name} game{' '}
							<span className="font-mono">{currentGame._id}</span>.
						</p>
					</div>
				</div>
			</div>

			{/* perks panel */}
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<PerksPanel gameId={currentGame._id} />
				</div>
			</div>
		</div>
	);
}