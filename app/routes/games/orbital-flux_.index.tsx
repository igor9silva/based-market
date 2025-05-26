import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { z } from 'zod';
import { ConfigPanel } from '~/components/games/orbital-flux/components/ConfigPanel';
import { DEFAULT_GAME_CONFIG } from '~/components/games/orbital-flux/constants';
import type { GameConfig } from '~/components/games/orbital-flux/types';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/games/orbital-flux_/')({
	component: RouteComponent,
	validateSearch: z.object({
		isExpanded: z.boolean().optional(),
	}),
});

function RouteComponent() {
	//
	console.log('Base route loaded');

	const navigate = useNavigate();
	const startGame = useMutation(api.games.public.start);
	const [config, setConfig] = useState<GameConfig>(DEFAULT_GAME_CONFIG);
	const [isCreating, setIsCreating] = useState(false);

	/**
	 * handles creating a new game with current config
	 */
	const handleStartNewGame = async () => {
		//
		setIsCreating(true);
		try {
			console.log('Creating game with config:', config);
			const gameId = await startGame({
				kind: 'orbital-flux',
				config,
			});
			console.log('Game created with ID:', gameId);

			// navigate to the specific game
			navigate({
				to: '/games/orbital-flux/$id',
				params: { id: gameId },
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
