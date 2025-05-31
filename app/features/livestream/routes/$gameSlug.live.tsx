import { createFileRoute, useParams, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { Loading } from '~/../../components/Loading';
import OrbitalFlux from '~/../../packages/orbital-flux/OrbitalFlux'; // Assuming OrbitalFlux can handle generic config
import { ConfigPanel } from '~/../../packages/orbital-flux/components/ConfigPanel'; // ConfigPanel might need to be more generic or replaced for other games
import { LiveCountdownBar } from '~/../../packages/orbital-flux/components/LiveCountdownBar';
import { LivePerksPanel } from '~/../../packages/orbital-flux/components/LivePerksPanel'; // PerksPanel might also need to be game-specific
import { DEFAULT_GAME_CONFIG, LIVE_COUNTDOWN_DURATION } from '~/../../packages/orbital-flux/constants';
// GameConfig from orbital-flux, used for default values. Actual config can be generic.
import type { GameConfig } from '~/../../packages/orbital-flux/types';
import { Button } from '~/../../components/ui/button';

// NOTE: Add LIVE_GAME_PASSWORD to your .env.local file for live game control
// This password is used for administrative actions on live games.

/**
 * formats elapsed time from milliseconds to MM:SS format
 */
function formatElapsedTime(startTime: number | undefined, currentTime: number): string {
	//
	if (!startTime) return '00:00';

	const elapsed = Math.max(0, currentTime - startTime);
	const minutes = Math.floor(elapsed / 60000);
	const seconds = Math.floor((elapsed % 60000) / 1000);

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * hook to get current time that updates every second
 */
function useCurrentTime() {
	//
	const [currentTime, setCurrentTime] = useState(Date.now());

	useEffect(() => {
		//
		const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
		return () => clearInterval(interval);
	}, []);

	return currentTime;
}

export const Route = createFileRoute('/games/$gameSlug/live')({
	component: RouteComponent,
	validateSearch: z.object({
		// UI configuration for sidebar
		isExpanded: z.boolean().optional().default(true),

		// Auto-play and authentication for live game control
		autoPlay: z.boolean().optional().default(false),
		password: z.string().optional(), // Password can be passed via URL for convenience

		// Game configuration parameters (example for Orbital Flux, could be different for other games)
		// These are parsed from the URL search parameters.
		gridWidth: z.coerce.number().optional(),
		gridHeight: z.coerce.number().optional(),
		orbSpeed: z.coerce.number().optional(),
		winThreshold: z.coerce.number().optional(),
		blockSize: z.coerce.number().optional(),
	}),
});

type LiveState = 'idle' | 'starting' | 'playing' | 'countdown';

function RouteComponent() {
	//
	const searchParams = useSearch({ from: '/games/$gameSlug/live' });
	// gameSlug (e.g., "orbital-flux") determines the game kind.
	const { gameSlug } = useParams({ from: '/games/$gameSlug/live' });
	const currentLiveGame = useQuery(api.games.public.getCurrentLiveGame); // Fetches any currently live game
	const currentTime = useCurrentTime(); // For displaying elapsed time

	// === STATE MANAGEMENT ===
	const [state, setState] = useState<LiveState>('idle'); // Manages the overall state of the live page
	const [currentGameId, setCurrentGameId] = useState<Id<'games'> | null>(null); // ID of the active game
	const [countdown, setCountdown] = useState(LIVE_COUNTDOWN_DURATION); // Countdown timer between games
	const [lastWinner, setLastWinner] = useState<string | null>(null); // Stores the winner of the last game
	const [password, setPassword] = useState<string | null>(searchParams.password || null); // Admin password
	const [isLoading, setIsLoading] = useState(false); // For loading states during API calls
	const [gameStartTime, setGameStartTime] = useState<number | undefined>(undefined); // Start time of the current game
	const gameRef = useRef<{ startGame: () => void } | null>(null); // Ref to the game component instance (currently not used for OrbitalFlux)

	// === CONFIGURATION ===
	// Game configuration is primarily taken from URL search parameters.
	// This allows for dynamic configuration of live games.
	const urlConfig = useMemo((): Record<string, any> => {
		const newConfig: Record<string, any> = {};
		// Example for Orbital Flux specific params. Other games might have different URL params.
		if (searchParams.gridWidth) newConfig.gridWidth = searchParams.gridWidth;
		if (searchParams.gridHeight) newConfig.gridHeight = searchParams.gridHeight;
		if (searchParams.orbSpeed) newConfig.orbSpeed = searchParams.orbSpeed;
		if (searchParams.winThreshold) newConfig.winThreshold = searchParams.winThreshold;
		if (searchParams.blockSize) newConfig.blockSize = searchParams.blockSize;
		return newConfig;
	}, [
		searchParams.gridWidth,
		searchParams.gridHeight,
		searchParams.orbSpeed,
		searchParams.winThreshold,
		searchParams.blockSize,
	]);

	// The final configuration merges URL parameters with default game config (e.g., DEFAULT_GAME_CONFIG for orbital-flux).
	// This ensures that if some params are not provided in the URL, defaults are used.
	const [config, setConfig] = useState<Record<string, any>>({ ...DEFAULT_GAME_CONFIG, ...urlConfig });

	// === MUTATIONS ===
	// Mutation to start a new live game. The `gameSlug` is passed as `kind`.
	const startLiveGameMutation = useMutation(api.games.public.startLive);
	const stopLiveGameMutation = useMutation(api.games.public.stopLive);
	const cleanupAllGamesMutation = useMutation(api.games.public.cleanupAll);

	// === HANDLERS ===

	/**
	 * Prompts for the live game password if not already set or provided in the URL.
	 * This password is required for administrative actions like starting or stopping live games.
	 */
	const promptPassword = useCallback(() => {
		//
		// Use URL password if available
		if (searchParams.password) {
			setPassword(searchParams.password);
			return searchParams.password;
		}

		// otherwise prompt user
		const pwd = window.prompt('Enter live game password:');
		if (pwd) {
			setPassword(pwd);
		}
		return pwd;
	}, [searchParams.password]);

	/**
	 * creates and starts a new live game
	 */
	const createNewGame = useCallback(async () => {
		//
		setIsLoading(true);
		setState('starting');
		try {
			const pwd = password || promptPassword();
			if (!pwd) {
				setState('idle');
				return;
			}

			// The `gameSlug` from the URL (e.g., "orbital-flux") determines the `kind` of game to start.
			// The `config` is passed as a generic object, allowing different games to have different settings.
			const gameId = await startLiveGameMutation({
				password: pwd,
				kind: gameSlug, // gameSlug from URL is used as the game kind
				config, // Generic config object
			});
			setCurrentGameId(gameId);
			setState('playing');
		} catch (error) {
			console.error('Failed to start live game:', error);
			alert(`Failed to start live game: ${error}`);
			setState('idle');
		} finally {
			setIsLoading(false);
		}
	}, [startLiveGame, password, promptPassword, config]);

	/**
	 * handles when a game finishes and a winner is declared
	 */
	const handleWinner = useCallback(async (winner: string) => {
		setLastWinner(winner);
		setState('countdown');
		setCountdown(LIVE_COUNTDOWN_DURATION);
	}, []);

	/**
	 * stops the current live game
	 */
	const handleStopGame = useCallback(async () => {
		//
		const pwd = password || promptPassword();
		if (!pwd) return;

		setIsLoading(true);
		try {
			await stopLiveGameMutation({ password: pwd });
			setState('idle');
			setCurrentGameId(null);
		} catch (error) {
			console.error('Failed to stop live game:', error);
			alert(`❌ Failed to stop live game: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [stopLiveGameMutation, password, promptPassword]);

	/**
	 * cleanup all games
	 */
	const handleCleanup = useCallback(async () => {
		//
		const pwd = password || promptPassword();
		if (!pwd) return;

		const confirmed = window.confirm('🚨 EMERGENCY CLEANUP 🚨\nThis will stop ALL running games.\nAre you sure?');
		if (!confirmed) return;

		setIsLoading(true);
		try {
			const result = await cleanupAllGamesMutation({ password: pwd });
			alert(`✅ Cleanup complete: ${result.stoppedGames} games stopped`);
			setState('idle');
			setCurrentGameId(null);
		} catch (error) {
			console.error('Failed to cleanup games:', error);
			alert(`❌ Failed to cleanup games: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [cleanupAllGamesMutation, password, promptPassword]);

	/**
	 * handles when game component mounts - auto-start the game
	 */
	const handleGameStart = useCallback(() => {
		console.log('Game auto-started');
	}, []);

	/**
	 * handles game state changes to track start time
	 */
	const handleGameStateChange = useCallback((gameState: any) => {
		//
		setGameStartTime(gameState.startTime);
	}, []);

	// === EFFECTS ===

	/**
	 * countdown timer effect - runs when in countdown state
	 */
	useEffect(() => {
		//
		if (state !== 'countdown') return;

		const timer = setInterval(() => {
			//
			setCountdown((prev) => {
				//
				if (prev <= 1) {
					// countdown finished, start new game
					// createNewGame();
					window.location.reload();
					return LIVE_COUNTDOWN_DURATION;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [state, createNewGame]);

	/**
	 * autoPlay effect - automatically starts a game when autoPlay is enabled
	 */
	useEffect(() => {
		//
		// exit early if autoPlay is disabled
		if (!searchParams.autoPlay) return;

		// wait for currentLiveGame to be determined
		if (currentLiveGame === undefined) return;

		// don't start if there's already a game running or we're not idle
		if (currentLiveGame || state !== 'idle') return;

		// automatically start the game
		console.log('🎮 AutoPlay: Starting live game automatically...');
		createNewGame();
	}, [searchParams.autoPlay, currentLiveGame, state, createNewGame]);

	/**
	 * config sync effect - updates config when URL parameters change
	 */
	useEffect(() => {
		//
		const newConfig = { ...DEFAULT_GAME_CONFIG, ...urlConfig };
		setConfig(newConfig);
	}, [urlConfig]);

	// === RENDER LOGIC ===

	// loading state
	if (currentLiveGame === undefined || isLoading) {
		return <Loading />;
	}

	// existing live game detected - show control options
	if (currentLiveGame && state === 'idle') {
		return (
			<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
				<div className="text-center space-y-6 max-w-md">
					<p className="text-muted-foreground">
						Live game running
						<br />
						<span className="font-mono text-sm">{currentLiveGame._id}</span>
					</p>

					<div className="space-y-4">
						<Button onClick={handleStopGame} variant="destructive" size="lg" className="w-full">
							⏹️ Stop Current Game
						</Button>

						<Button
							onClick={handleCleanup}
							variant="destructive"
							size="lg"
							className="w-full bg-red-700 hover:bg-red-800"
						>
							🧹 Emergency Cleanup All
						</Button>
					</div>

					{password && <p className="text-xs text-muted-foreground">Password set ✓</p>}
				</div>
			</div>
		);
	}

// No active game - show configuration and start controls.
// This UI allows an admin to start a new live game with specific configurations.
	if (state === 'idle' && !currentLiveGame) {
		return (
			<div className="h-screen bg-background text-foreground overflow-hidden">
				<div className="h-full flex items-center justify-center">
					<div className="w-96 bg-card border border-border rounded-lg p-6">
					{/* Title dynamically shows the gameSlug */}
					<h1 className="text-2xl font-bold text-center mb-6">{gameSlug} Live</h1>

						<div className="space-y-6">
						{/* ConfigPanel is currently Orbital Flux specific.
                For other games, this would need to be a dynamic component
                or a more generic configuration UI. */}
							<ConfigPanel config={config} isRunning={false} onConfigChange={setConfig} />

							<div className="space-y-3">
								<Button onClick={createNewGame} disabled={isLoading} className="w-full" size="lg">
								{isLoading ? `Starting ${gameSlug} Live...` : `🎮 START ${gameSlug.toUpperCase()} LIVE`}
								</Button>

								<Button onClick={handleCleanup} variant="destructive" className="w-full">
									🧹 Emergency Cleanup
								</Button>
							</div>
						</div>

						{password && <p className="text-xs text-muted-foreground text-center mt-4">Password set ✓</p>}
					</div>
				</div>
			</div>
		);
	}

// GAME IS RUNNING - Show the game interface.
// For live streams, controls are usually hidden, and perks/stats might be displayed differently.
	if (currentGameId) {
		const customStatsBar =
			state === 'countdown' && lastWinner ? (
				<LiveCountdownBar winner={lastWinner} countdown={countdown} />
			) : undefined;

		const elapsedTime = formatElapsedTime(gameStartTime, currentTime);

	// The OrbitalFlux component is used here. If other games are added,
	// a dynamic component loader would be needed to render the correct game UI
	// based on `gameSlug` or `currentLiveGame.kind`.
		return (
			<div className="h-screen bg-background flex flex-col overflow-hidden">
				{/* game area */}
				<div className="flex-1">
				<OrbitalFlux // This would need to be dynamic for other games
						gameId={currentGameId}
					enablePerks={true} // Perks can be enabled/disabled
					showStats={true} // Stats display can be toggled
					autoStart={true} // Game starts automatically when component mounts
					customStatsBar={customStatsBar} // Custom bar for countdowns, etc.
					customRightPanel={<LivePerksPanel gameId={currentGameId} />} // Panel for live perks, could be game-specific
					showSidebarToggle={false} // Sidebar toggle usually hidden for live view
					hideGameControls={true} // Game controls (start/stop) hidden for live view
					onWinner={handleWinner} // Callback when a winner is determined
					onGameStart={handleGameStart} // Callback when the game starts
					onGameStateChange={handleGameStateChange} // Callback for game state updates
					initialConfig={config} // The game is initialized with the current config state
					/>
				</div>

				{/* game ID and elapsed time footer */}
				<div className="bg-background/80 backdrop-blur-sm border-t border-border">
					<p className="text-xs text-muted-foreground text-center font-mono py-2">
						{currentGameId} • Elapsed: {elapsedTime}
					</p>
				</div>
			</div>
		);
	}

// Fallback - should not reach here normally if logic is correct.
	return (
		<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
			<div className="text-center">
			<p className="text-muted-foreground">No game running or invalid state.</p>
			</div>
		</div>
	);
}
