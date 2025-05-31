import { createFileRoute, useSearch } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { z } from 'zod';
import { gameRegistry } from '~/lib/games';
import { LiveGameControls } from '~/components/games/admin/LiveGameControls';
import { Button } from '~/components/ui/button';

export const Route = createFileRoute('/games/$gameSlug/live')({
	component: RouteComponent,
	validateSearch: z.object({
		// UI configuration
		isExpanded: z.boolean().optional().default(true),
		// auto-play and authentication
		autoPlay: z.boolean().optional().default(false),
		password: z.string().optional(),
		// dynamic config parameters - will be merged with game defaults
	}).catchall(z.coerce.number().optional()),
});

function RouteComponent() {
	//
	const { gameSlug } = Route.useParams();
	const searchParams = useSearch({ from: '/games/$gameSlug/live' });
	const gameDefinition = gameRegistry.getGame(gameSlug);

	const [gameState, setGameState] = useState<'idle' | 'configuration' | 'running'>('idle');
	const [currentGameId, setCurrentGameId] = useState<string | null>(null);

	// merge URL config parameters with game defaults
	const urlConfig = useMemo(() => {
		//
		if (!gameDefinition) return {};

		const config = { ...gameDefinition.defaultConfig };
		
		// apply any URL parameters that match config keys
		Object.keys(searchParams).forEach((key) => {
			if (key in config && typeof searchParams[key] === 'number') {
				config[key] = searchParams[key];
			}
		});

		return config;
	}, [gameDefinition, searchParams]);

	const [config, setConfig] = useState(urlConfig);

	// update config when URL parameters change
	useEffect(() => {
		setConfig(urlConfig);
	}, [urlConfig]);

	const handleGameCreated = useCallback((gameId: string) => {
		setCurrentGameId(gameId);
		setGameState('running');
	}, []);

	const handleGameStopped = useCallback(() => {
		setCurrentGameId(null);
		setGameState('idle');
	}, []);

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

	// game is running - show only the game
	if (gameState === 'running' && currentGameId) {
		return (
			<div className="h-screen bg-background flex flex-col overflow-hidden">
				<div className="flex-1">
					<GameComponent
						gameId={currentGameId}
						config={config}
						mode="live"
						enablePerks={true}
						showStats={true}
						autoStart={true}
						showSidebarToggle={false}
						hideGameControls={true}
					/>
				</div>
				
				{/* game ID footer */}
				<div className="bg-background/80 backdrop-blur-sm border-t border-border">
					<p className="text-xs text-muted-foreground text-center font-mono py-2">
						{currentGameId}
					</p>
				</div>
			</div>
		);
	}

	// no active game - show configuration and controls
	return (
		<LiveGameControls
			gameSlug={gameSlug}
			password={searchParams.password}
			onGameCreated={handleGameCreated}
			onGameStopped={handleGameStopped}
		>
			<h1 className="text-2xl font-bold text-center mb-6">{gameDefinition.metadata.name} Live</h1>

			<div className="space-y-6">
				<ConfigPanel config={config} isRunning={false} onConfigChange={setConfig} />

				<Button
					onClick={() => {
						// this will be handled by the LiveGameControls component
						// we just need to trigger the creation
					}}
					className="w-full"
					size="lg"
				>
					🎮 START LIVE GAME
				</Button>
			</div>
		</LiveGameControls>
	);
}