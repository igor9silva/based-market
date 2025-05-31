import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { z } from 'zod';
import { ConfigPanel } from '~/../../packages/orbital-flux/components/ConfigPanel';
import { DEFAULT_GAME_CONFIG } from '~/../../packages/orbital-flux/constants';
// Assuming GameConfig might still be useful for type hints with default values,
// but the actual config passed to the backend is Record<string, any>.
import type { GameConfig } from '~/../../packages/orbital-flux/types';
import { Button } from '~/../../components/ui/button';

/**
 * Route for displaying the configuration page for a specific game.
 * The `gameSlug` parameter in the URL determines which game's configuration is shown.
 */
export const Route = createFileRoute('/games/$gameSlug/')({
	component: RouteComponent,
	validateSearch: z.object({
		isExpanded: z.boolean().optional(), // Used for sidebar visibility, not directly game-related
	}),
});

function RouteComponent() {
	//
	console.log('Game configuration route loaded');

	const navigate = useNavigate();
	// Get the gameSlug from the URL (e.g., "orbital-flux")
	const { gameSlug } = useParams({ from: '/games/$gameSlug/' });
	const startGameMutation = useMutation(api.games.public.start);
	// Initialize config with default values, specific game might override this
	// For Orbital Flux, DEFAULT_GAME_CONFIG is used. Other games might have different defaults.
	const [config, setConfig] = useState<Record<string, any>>(DEFAULT_GAME_CONFIG);
	const [isCreating, setIsCreating] = useState(false);

	/**
	 * Handles creating a new game instance with the current configuration.
	 * The `gameSlug` from the URL is used as the `kind` for the new game.
	 * After the game is created, it navigates to the specific game instance page.
	 */
	const handleStartNewGame = async () => {
		//
		setIsCreating(true);
		try {
			console.log(`Creating ${gameSlug} game with config:`, config);
			// The `gameSlug` (e.g., "orbital-flux") is passed as the `kind` to the backend.
			// The `config` is passed as a generic object.
			const gameId = await startGameMutation({
				kind: gameSlug, // gameSlug from URL determines the type of game to start
				config,
			});
			console.log('Game created with ID:', gameId);

			// Navigate to the specific game instance page, including the gameSlug.
			navigate({
				to: '/games/$gameSlug/$id', // Dynamic path based on gameSlug
				params: { gameSlug, id: gameId },
				replace: true,
			});
			console.log('Navigation to game instance called');
		} catch (error) {
			console.error('Failed to start game:', error);
			setIsCreating(false);
		}
	};

	return (
		<div className="h-screen bg-background text-foreground overflow-hidden">
			<div className="h-full flex items-center justify-center">
				<div className="w-96 bg-card border border-border rounded-lg p-6">
					<h1 className="text-2xl font-bold text-center mb-6">Orbital Flux</h1>

					<div className="space-y-6">
						<ConfigPanel config={config} isRunning={false} onConfigChange={setConfig} />

						<Button onClick={handleStartNewGame} disabled={isCreating} className="w-full" size="lg">
							{isCreating ? 'Creating Game...' : 'START GAME'}
						</Button>
					</div>
				</div>
			</div>
		</div>
	);
}
