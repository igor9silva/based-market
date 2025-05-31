import { createFileRoute } from '@tanstack/react-router';
import { gameRegistry } from '~/lib/games';

export const Route = createFileRoute('/games/')({
	component: RouteComponent,
});

function RouteComponent() {
	//
	const availableGames = gameRegistry.getActiveGames();

	return (
		<div className="h-screen bg-background text-foreground overflow-hidden">
			<div className="h-full flex items-center justify-center">
				<div className="w-full max-w-2xl px-6">
					<h1 className="text-3xl font-bold text-center mb-8">Available Games</h1>

					<div className="grid gap-4">
						{availableGames.map((game) => (
							<div
								key={game.metadata.slug}
								className="bg-card border border-border rounded-lg p-6 hover:bg-card/80 transition-colors"
							>
								<div className="space-y-3">
									<h2 className="text-xl font-bold">{game.metadata.name}</h2>
									<p className="text-muted-foreground">{game.metadata.description}</p>

									<div className="flex gap-2">
										<a
											href={`/games/${game.metadata.slug}`}
											className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
										>
											Play Game
										</a>
										
										<a
											href={`/games/${game.metadata.slug}/perks`}
											className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
										>
											Buy Perks
										</a>
									</div>
								</div>
							</div>
						))}
					</div>

					{availableGames.length === 0 && (
						<div className="text-center text-muted-foreground">
							<p>No games are currently available.</p>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}