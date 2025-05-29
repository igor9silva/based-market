import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';
import { LiveCountdownBar } from '~/components/games/orbital-flux/components/LiveCountdownBar';
import { DEFAULT_GAME_CONFIG, LIVE_COUNTDOWN_DURATION } from '~/components/games/orbital-flux/constants';
import { TextShimmer } from '~/components/ui/text-shimmer';

export const Route = createFileRoute('/live')({
	component: RouteComponent,
	validateSearch: () => ({
		isExpanded: true, // start in expanded mode (sidebar closed)
	}),
});

type LiveState = 'starting' | 'playing' | 'countdown';

function RouteComponent() {
	//
	const [state, setState] = useState<LiveState>('starting');
	const [currentGameId, setCurrentGameId] = useState<Id<'games'> | null>(null);
	const [countdown, setCountdown] = useState(LIVE_COUNTDOWN_DURATION);
	const [lastWinner, setLastWinner] = useState<string | null>(null);
	const gameRef = useRef<{ startGame: () => void } | null>(null);

	const startGame = useMutation(api.games.public.start);

	/**
	 * creates and starts a new game
	 */
	const createNewGame = useCallback(async () => {
		//
		setState('starting');
		try {
			const gameId = await startGame({
				kind: 'orbital-flux',
				config: DEFAULT_GAME_CONFIG,
			});
			setCurrentGameId(gameId);
			setState('playing');
		} catch (error) {
			console.error('Failed to start game:', error);
			// retry after 5 seconds on error
			setTimeout(createNewGame, 5000);
		}
	}, [startGame]);

	/**
	 * handles when a game finishes and a winner is declared
	 */
	const handleWinner = useCallback((winner: string) => {
		//
		setLastWinner(winner);
		setState('countdown');
		setCountdown(LIVE_COUNTDOWN_DURATION);
	}, []);

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

	/**
	 * start first game on mount
	 */
	useEffect(() => {
		//
		createNewGame();
	}, [createNewGame]);

	// show starting state
	if (state === 'starting' || !currentGameId) {
		return (
			<div className="h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<TextShimmer text="Starting new game..." className="text-xl" />
					<p className="text-muted-foreground mt-2">Please wait while we prepare the arena</p>
				</div>
			</div>
		);
	}

	// prepare custom stats bar for countdown
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
				onWinner={handleWinner}
				onGameStart={handleGameStart}
				initialConfig={{ ...DEFAULT_GAME_CONFIG }}
			/>

			{/* game ID footer - positioned absolutely within screen */}
			<div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm">
				<p className="text-xs text-muted-foreground text-center font-mono py-1">Game ID: {currentGameId}</p>
			</div>
		</div>
	);
}
