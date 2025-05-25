import { Link } from '@tanstack/react-router';

const GAMES = [
	{
		id: 'orbital-flux',
		name: 'Orbital Flux',
		path: '/games/orbital-flux',
	},
	// add more games here as they become available
];

export default function GamesList() {
	//
	return (
		<div className="container mx-auto p-6">
			<ul className="space-y-2">
				{GAMES.map((game) => (
					<li key={game.id}>
						<Link to={game.path} className="text-blue-600 hover:text-blue-800 underline text-lg">
							{game.name}
						</Link>
					</li>
				))}
			</ul>
		</div>
	);
}
