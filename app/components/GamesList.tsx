import { Link } from '@tanstack/react-router';
import { gameRegistry } from '~/lib/games';

export default function GamesList() {
	//
	const availableGames = gameRegistry.getActiveGames();

	return (
		<div className="container mx-auto p-6">
			<h1 className="text-2xl font-bold mb-6">Available Games</h1>
			
			{availableGames.length === 0 ? (
				<p className="text-muted-foreground">No games are currently available.</p>
			) : (
				<ul className="space-y-4">
					{availableGames.map((game) => (
						<li key={game.metadata.slug} className="border border-border rounded-lg p-4">
							<h2 className="text-xl font-semibold mb-2">
								<Link 
									to="/games/$gameSlug" 
									params={{ gameSlug: game.metadata.slug }}
									className="text-blue-600 hover:text-blue-800 underline"
								>
									{game.metadata.name}
								</Link>
							</h2>
							<p className="text-muted-foreground mb-3">{game.metadata.description}</p>
							<div className="flex gap-2">
								<Link 
									to="/games/$gameSlug" 
									params={{ gameSlug: game.metadata.slug }}
									className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
								>
									Play
								</Link>
								<Link 
									to="/games/$gameSlug/perks" 
									params={{ gameSlug: game.metadata.slug }}
									className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm hover:bg-secondary/90"
								>
									Buy Perks
								</Link>
							</div>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
