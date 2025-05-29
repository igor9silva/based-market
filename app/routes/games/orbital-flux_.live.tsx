import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Loading } from '~/components/Loading';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';
import { LiveCountdownBar } from '~/components/games/orbital-flux/components/LiveCountdownBar';
import { DEFAULT_GAME_CONFIG, LIVE_COUNTDOWN_DURATION } from '~/components/games/orbital-flux/constants';
import { Button } from '~/components/ui/button';

// NOTE: Add LIVE_GAME_PASSWORD to your .env.local file for live game control

export const Route = createFileRoute('/games/orbital-flux_/live')({
	component: RouteComponent,
	validateSearch: () => ({
		isExpanded: true, // start in expanded mode (sidebar closed)
	}),
});

type LiveState = 'idle' | 'starting' | 'playing' | 'countdown';

function RouteComponent() {
	//
	// check if there's already a live game running
	const currentLiveGame = useQuery(api.games.public.getCurrentLiveGame);

	const [state, setState] = useState<LiveState>('idle');
	const [currentGameId, setCurrentGameId] = useState<Id<'games'> | null>(null);
	const [countdown, setCountdown] = useState(LIVE_COUNTDOWN_DURATION);
	const [lastWinner, setLastWinner] = useState<string | null>(null);
	const [password, setPassword] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const gameRef = useRef<{ startGame: () => void } | null>(null);

	const startLiveGame = useMutation(api.games.public.startLive);
	const finishLiveGame = useMutation(api.games.public.finishLive);
	const stopLiveGame = useMutation(api.games.public.stopLive);
	const cleanupAllGames = useMutation(api.games.public.cleanupAll);

	// DON'T auto-sync with existing live game - always start with control options

	/**
	 * prompts for password
	 */
	const promptPassword = useCallback(() => {
		//
		const pwd = window.prompt('Enter live game password:');
		if (pwd) {
			setPassword(pwd);
		}
		return pwd;
	}, []);

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
				config: DEFAULT_GAME_CONFIG,
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
	}, [startLiveGame, password, promptPassword]);

	/**
	 * handles when a game finishes and a winner is declared
	 */
	const handleWinner = useCallback(
		async (winner: string) => {
			//
			setIsLoading(true);
			try {
				const pwd = password || promptPassword();
				if (!pwd) return;

				await finishLiveGame({
					password: pwd,
					winner: winner as 'white' | 'black',
				});
			} catch (error) {
				console.error('Failed to finish live game:', error);
			} finally {
				setIsLoading(false);
			}

			setLastWinner(winner);
			setState('countdown');
			setCountdown(LIVE_COUNTDOWN_DURATION);
		},
		[finishLiveGame, password, promptPassword],
	);

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
			alert('✅ Live game stopped successfully');
		} catch (error) {
			console.error('Failed to stop live game:', error);
			alert(`❌ Failed to stop live game: ${error}`);
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
		//
		// game automatically starts when mounted
		console.log('Game auto-started');
	}, []);

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
					createNewGame();
					return LIVE_COUNTDOWN_DURATION;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(timer);
	}, [state, createNewGame]);

	// USE LOADING COMPONENT FOR ALL LOADING STATES
	if (currentLiveGame === undefined || isLoading) {
		return <Loading />;
	}

	// IF THERE'S AN ACTIVE LIVE GAME - SHOW CONTROL OPTIONS (join or stop)
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

	// NO ACTIVE GAME - SHOW START CONTROLS
	if (state === 'idle' && !currentLiveGame) {
		return (
			<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
				<div className="text-center space-y-6 max-w-md">
					<div className="space-y-4">
						<Button onClick={createNewGame} size="lg" className="w-full">
							🎮 Start Live Game
						</Button>

						<Button onClick={handleCleanup} variant="destructive" size="lg" className="w-full">
							🧹 Emergency Cleanup
						</Button>
					</div>

					{password && <p className="text-xs text-muted-foreground">Password set ✓</p>}
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

		return (
			<div className="h-screen bg-background relative overflow-hidden">
				<OrbitalFlux
					gameId={currentGameId}
					enablePerks={true}
					showStats={true}
					autoStart={true}
					customStatsBar={customStatsBar}
					showSidebarToggle={false}
					hideGameControls={true}
					onWinner={handleWinner}
					onGameStart={handleGameStart}
					initialConfig={{ ...DEFAULT_GAME_CONFIG }}
				/>

				{/* game ID footer */}
				<div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm">
					<p className="text-xs text-muted-foreground text-center font-mono py-1">{currentGameId}</p>
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
