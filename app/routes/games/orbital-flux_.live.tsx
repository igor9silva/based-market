import { createFileRoute, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { Loading } from '~/components/Loading';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';
import { ConfigPanel } from '~/components/games/orbital-flux/components/ConfigPanel';
import { LiveCountdownBar } from '~/components/games/orbital-flux/components/LiveCountdownBar';
// import { LivePerksPanel } from '~/components/games/orbital-flux/components/LivePerksPanel'; // No longer used directly
import { LiveInfoPanel } from '~/components/games/orbital-flux/components/LiveInfoPanel'; // Add import
import {
	DEFAULT_GAME_CONFIG,
	LIVE_COUNTDOWN_DURATION,
	RANDOM_PERK_CONFIG,
} from '~/components/games/orbital-flux/constants';
import type { GameConfig } from '~/components/games/orbital-flux/types';
import { Button } from '~/components/ui/button';

// NOTE: Add LIVE_GAME_PASSWORD to your .env.local file for live game control

/**
 * generates a random interval between min-max minutes in milliseconds
 */
function getRandomPerkInterval(): number {
	//
	const { minMinutes, maxMinutes } = RANDOM_PERK_CONFIG;
	const randomMinutes = Math.floor(Math.random() * (maxMinutes - minMinutes + 1)) + minMinutes;

	return randomMinutes * 60 * 1000; // convert to milliseconds
}

/**
 * formats time remaining until next event in MM:SS format
 */
function formatTimeRemaining(milliseconds: number): string {
	//
	if (milliseconds <= 0) return '00:00';

	const totalSeconds = Math.ceil(milliseconds / 1000);
	const minutes = Math.floor(totalSeconds / 60);
	const seconds = totalSeconds % 60;

	return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * formats elapsed time from milliseconds to DD:HH:MM:SS, HH:MM:SS or MM:SS format
 */
function formatElapsedTime(startTime: number | undefined, currentTime: number): string {
	if (!startTime) return '00:00';

	let elapsed = Math.max(0, currentTime - startTime) / 1000; // work in seconds

	const days = Math.floor(elapsed / (24 * 60 * 60));
	elapsed %= 24 * 60 * 60;

	const hours = Math.floor(elapsed / (60 * 60));
	elapsed %= 60 * 60;

	const minutes = Math.floor(elapsed / 60);
	const seconds = Math.floor(elapsed % 60);

	let parts: string[] = [];
	if (days > 0) {
		parts.push(days.toString().padStart(2, '0'));
		parts.push(hours.toString().padStart(2, '0'));
	} else if (hours > 0) {
		parts.push(hours.toString().padStart(2, '0'));
	}
	parts.push(minutes.toString().padStart(2, '0'));
	parts.push(seconds.toString().padStart(2, '0'));

	// This logic simplifies: if days > 0, parts is [DD, HH, MM, SS]
	// if hours > 0 (and days = 0), parts is [HH, MM, SS]
	// otherwise, parts is [MM, SS] (or [00, SS] if minutes < 1)
	return parts.join(':');
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

export const Route = createFileRoute('/games/orbital-flux_/live')({
	component: RouteComponent,
	validateSearch: z.object({
		// UI configuration
		isExpanded: z.boolean().optional().default(true), // start in expanded mode (sidebar closed)

		// auto-play and authentication
		autoPlay: z.boolean().optional().default(false),
		password: z.string().optional(),

		// game configuration parameters
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
	const searchParams = useSearch({ from: '/games/orbital-flux_/live' });
	const currentLiveGame = useQuery(api.games.public.getCurrentLiveGame);
	const currentTime = useCurrentTime();

	// === STATE MANAGEMENT ===
	const [state, setState] = useState<LiveState>('idle');
	const [currentGameId, setCurrentGameId] = useState<Id<'games'> | null>(null);
	const [countdown, setCountdown] = useState(LIVE_COUNTDOWN_DURATION);
	const [lastWinner, setLastWinner] = useState<string | null>(null);
	const [password, setPassword] = useState<string | null>(searchParams.password || null);
	const [isLoading, setIsLoading] = useState(false);
	const [gameStartTime, setGameStartTime] = useState<number | undefined>(undefined);
	const [nextPerkTime, setNextPerkTime] = useState<number | null>(null);
	const perkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	/**
	 * clears the random perk timer and resets next perk time
	 */
	const clearPerkTimer = useCallback(() => {
		//
		if (perkTimerRef.current) {
			clearTimeout(perkTimerRef.current);
			perkTimerRef.current = null;
		}

		setNextPerkTime(null);
		//
	}, []);

	// === CONFIGURATION ===
	// merge URL config parameters with defaults
	const urlConfig = useMemo((): Partial<GameConfig> => {
		//
		const config: Partial<GameConfig> = {};

		if (searchParams.gridWidth) config.gridWidth = searchParams.gridWidth;
		if (searchParams.gridHeight) config.gridHeight = searchParams.gridHeight;
		if (searchParams.orbSpeed) config.orbSpeed = searchParams.orbSpeed;
		if (searchParams.winThreshold) config.winThreshold = searchParams.winThreshold;
		if (searchParams.blockSize) config.blockSize = searchParams.blockSize;

		return config;
	}, [
		searchParams.gridWidth,
		searchParams.gridHeight,
		searchParams.orbSpeed,
		searchParams.winThreshold,
		searchParams.blockSize,
	]);

	const [config, setConfig] = useState<GameConfig>({ ...DEFAULT_GAME_CONFIG, ...urlConfig });

	// === MUTATIONS ===
	const startLiveGame = useMutation(api.games.public.startLive);
	const stopLiveGame = useMutation(api.games.public.stopLive);
	const cleanupAllGames = useMutation(api.games.public.cleanupAll);
	const createAutoPayment = useMutation(api.payments.public.createAutoPayment);

	// === RANDOM PERK SYSTEM ===

	/**
	 * activates a random perk to prevent orbs from getting stuck
	 */
	const activateRandomPerk = useCallback(async () => {
		//
		if (!currentGameId || state !== 'playing') return;
		if (!password) return;

		try {
			await createAutoPayment({ gameId: currentGameId, password });
			//
		} catch (error) {
			//
			console.error('❌ Failed to create auto payment for random perk:', error);

			// if password is invalid, stop the random perk system
			if (error instanceof Error && error.message.includes('Invalid password')) {
				clearPerkTimer();
			}
		}
	}, [currentGameId, state, password, createAutoPayment]);

	/**
	 * schedules the next random perk activation
	 */
	const scheduleNextRandomPerk = useCallback(() => {
		//
		// clear existing timer
		if (perkTimerRef.current) {
			clearTimeout(perkTimerRef.current);
			console.log('🧹 Cleared existing perk timer');
		}

		// only schedule if game is playing
		if (state !== 'playing' || !currentGameId) {
			setNextPerkTime(null);
			return;
		}

		const interval = getRandomPerkInterval();
		const nextTime = Date.now() + interval;
		setNextPerkTime(nextTime);

		perkTimerRef.current = setTimeout(() => {
			//
			activateRandomPerk();
			scheduleNextRandomPerk(); // schedule the next one
			//
		}, interval);
		//
	}, [state, currentGameId, activateRandomPerk]);

	// calculate time remaining until next perk
	const timeUntilNextPerk = useMemo(() => {
		//
		if (!nextPerkTime || state !== 'playing') return null;
		return Math.max(0, nextPerkTime - currentTime);
		//
	}, [nextPerkTime, currentTime, state]);

	// === HANDLERS ===

	/**
	 * prompts for password (or uses URL password if available)
	 */
	const promptPassword = useCallback(() => {
		//
		// use URL password if available
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

			const gameId = await startLiveGame({
				password: pwd,
				kind: 'orbital-flux',
				config,
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
		//
		setLastWinner(winner);
		setState('countdown');
		setCountdown(LIVE_COUNTDOWN_DURATION);

		// clear random perk timer when game ends
		clearPerkTimer();
		//
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
			await stopLiveGame({ password: pwd });
			setState('idle');
			setCurrentGameId(null);

			// clear random perk timer
			clearPerkTimer();
			//
		} catch (error) {
			//
			console.error('Failed to stop live game:', error);
			alert(`❌ Failed to stop live game: ${error}`);
			//
		} finally {
			setIsLoading(false);
		}
	}, [stopLiveGame, password, promptPassword]);

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
			const result = await cleanupAllGames({ password: pwd });
			alert(`✅ Cleanup complete: ${result.stoppedGames} games stopped`);
			setState('idle');
			setCurrentGameId(null);

			// clear random perk timer
			clearPerkTimer();
			//
		} catch (error) {
			console.error('Failed to cleanup games:', error);
			alert(`❌ Failed to cleanup games: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [cleanupAllGames, password, promptPassword]);

	/**
	 * handles when game component mounts - auto-start the game
	 */
	const handleGameStart = useCallback(() => {
		console.log('🎮 Game auto-started, starting random perk system...');
		// start the random perk system when game starts
		scheduleNextRandomPerk();
		//
	}, [scheduleNextRandomPerk]);

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

	/**
	 * cleanup effect - clear timers on unmount
	 */
	useEffect(() => {
		//
		return () => {
			if (perkTimerRef.current) {
				clearTimeout(perkTimerRef.current);
			}
		};
		//
	}, []);

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

	// no active game - show configuration and start controls
	if (state === 'idle' && !currentLiveGame) {
		return (
			<div className="h-screen bg-background text-foreground overflow-hidden">
				<div className="h-full flex items-center justify-center">
					<div className="w-96 bg-card border border-border rounded-lg p-6">
						<h1 className="text-2xl font-bold text-center mb-6">Orbital Flux Live</h1>

						<div className="space-y-6">
							<ConfigPanel config={config} isRunning={false} onConfigChange={setConfig} />

							<div className="space-y-3">
								<Button onClick={createNewGame} disabled={isLoading} className="w-full" size="lg">
									{isLoading ? 'Starting Live Game...' : '🎮 START LIVE GAME'}
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

	// GAME IS RUNNING - SHOW ONLY THE GAME (no control buttons for livestream)
	if (currentGameId) {
		const customStatsBar =
			state === 'countdown' && lastWinner ? (
				<LiveCountdownBar winner={lastWinner} countdown={countdown} />
			) : undefined;

		const elapsedTime = formatElapsedTime(gameStartTime, currentTime);

		return (
			<div className="h-screen bg-background flex flex-row overflow-hidden">
				{/* Left Section (Game Area) - 70% width */}
				<div className="w-[70%] flex-shrink-0 flex justify-center items-center relative">
					<OrbitalFlux
						gameId={currentGameId}
						password={password ?? undefined}
						enablePerks={true}
						showStats={true}
						autoStart={true}
						customStatsBar={customStatsBar}
						// customRightPanel is removed
						showSidebarToggle={false}
						hideGameControls={true}
						onWinner={handleWinner}
						onGameStart={handleGameStart}
						onGameStateChange={handleGameStateChange}
						initialConfig={config}
					/>
				</div>

				{/* Right Section (Info Panel) - 30% width */}
				<div className="w-[30%] flex-shrink-0 bg-card border-l border-border p-4 overflow-y-auto">
					<LiveInfoPanel
						gameId={currentGameId}
						elapsedTime={elapsedTime}
						nextEventTime={timeUntilNextPerk !== null ? formatTimeRemaining(timeUntilNextPerk) : null}
					/>
				</div>
			</div>
		);
	}

	// fallback - should not reach here normally
	return (
		<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
			<div className="text-center">
				<p className="text-muted-foreground">No game running</p>
			</div>
		</div>
	);
}
