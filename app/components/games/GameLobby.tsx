import { useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { gameRegistry } from '~/lib/games';
import { Button } from '~/components/ui/button';

interface GameLobbyProps {
	gameSlug: string;
}

export function GameLobby({ gameSlug }: GameLobbyProps) {
	//
	const navigate = useNavigate();
	const startGame = useMutation(api.games.public.start);
	const gameDefinition = gameRegistry.getGame(gameSlug);

	const [config, setConfig] = useState(gameDefinition?.defaultConfig);
	const [isCreating, setIsCreating] = useState(false);

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

	const { GameComponent, ConfigPanel } = gameDefinition.components;

	/**
	 * handles creating a new game with current config
	 */
	const handleStartNewGame = async () => {
		//
		if (!config) return;

		setIsCreating(true);
		try {
			console.log('Creating game with config:', config);
			const gameId = await startGame({
				kind: gameSlug as any,
				config,
			});
			console.log('Game created with ID:', gameId);

			// navigate to the specific game
			navigate({
				to: '/games/$gameSlug/$gameId',
				params: { gameSlug, gameId },
				replace: true,
			});
			console.log('Navigation called');
		} catch (error) {
			console.error('Failed to start game:', error);
			setIsCreating(false);
		}
	};

	return (
		<div className="h-screen bg-background text-foreground overflow-hidden">
			<div className="h-full flex items-center justify-center">
				<div className="w-96 bg-card border border-border rounded-lg p-6">
					<h1 className="text-2xl font-bold text-center mb-6">{gameDefinition.metadata.name}</h1>

					<div className="space-y-6">
						{config && (
							<ConfigPanel config={config} isRunning={false} onConfigChange={setConfig} />
						)}

						<Button onClick={handleStartNewGame} disabled={isCreating || !config} className="w-full" size="lg">
							{isCreating ? 'Creating Game...' : 'START GAME'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}