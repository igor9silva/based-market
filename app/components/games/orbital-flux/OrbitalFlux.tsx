import { useNavigate, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import { DEFAULT_GAME_CONFIG, DEFAULT_PERK_CONFIG } from './constants';
import { useGameAnimation } from './hooks/useGameAnimation';
import { useGameState } from './hooks/useGameState';
import { usePaymentPerkActivation } from './hooks/usePaymentPerkActivation';
import { usePerkHost } from './hooks/usePerkHost';
import type { EffectType, GameConfig, GameStats, OrbitalFluxProps, PerkConfig } from './types';
import { calculateTerritoryStats } from './utils';

// components
import { PaymentsPanel } from '~/components/games/orbital-flux/components/PaymentsPanel';
import { GameCanvas } from './components/GameCanvas';
import { PerkPanel } from './components/PerkPanel';
import { TerritoryStatsBar } from './components/TerritoryStatsBar';

export default function OrbitalFlux({
	// initial configuration
	initialConfig = {},
	initialPerkConfig = {},
	// backend integration
	gameId,
	// customization options
	enablePerks = true,
	showStats = true,
	autoStart = false,
	customStatsBar,
	customRightPanel,
	showSidebarToggle = true,
	hideGameControls = false,
	// event callbacks
	onGameStart,
	onGameStop,
	onGameReset,
	onWinner,
	onTerritoryChange,
}: OrbitalFluxProps) {
	//
	// merge initial configs with defaults
	const [config, setConfig] = useState<GameConfig>({
		...DEFAULT_GAME_CONFIG,
		...initialConfig,
	});

	const [perkConfig] = useState<PerkConfig>({
		...DEFAULT_PERK_CONFIG,
		...initialPerkConfig,
	});

	// backend mutations (only if gameId is provided)
	const finishGameMutation = useMutation(api.games.public.finish);

	// perk host - manages perks client-side as "host"
	const perkHost = usePerkHost(gameId || ('' as Id<'games'>));

	// sidebar visibility from URL params
	const navigate = useNavigate();
	const search = useSearch({ strict: false });
	const isSidebarOpen = !search.isExpanded; // isExpanded means sidebar is closed

	const toggleSidebar = () => {
		//
		navigate({
			to: '.',
			search: (prev: any) => ({ ...prev, isExpanded: !prev.isExpanded }),
		});
	};

	/**
	 * handles winner with backend integration
	 */
	const handleWinner = async (winner: string) => {
		//
		// only update backend if gameId is provided
		if (gameId) {
			try {
				await finishGameMutation({ gameId, winner: winner as 'white' | 'black' });
			} catch (error) {
				console.error('Failed to finish game in backend:', error);
			}
		}

		// call the original callback
		onWinner?.(winner);
	};

	// game state management
	const { gameState, initializeGame, updateGameState, startGame, stopGame, resetGame, activateEffect } = useGameState(
		{
			config,
			perkConfig,
			onWinner: handleWinner,
			onTerritoryChange,
		},
	);

	/**
	 * activates a perk in both the game simulation and backend
	 */
	const handlePerkActivation = useCallback(
		async (type: EffectType, side: 'white' | 'black' | 'neutral', duration: number) => {
			//
			// activate in game simulation immediately (only if game is running)
			if (gameState.isRunning) {
				activateEffect(type as any, side as any);
			}

			// also persist to backend via perk host (only if gameId is provided)
			await perkHost.activatePerk(type, side, duration);
		},
		[activateEffect, perkHost.activatePerk, gameState.isRunning, gameId],
	);

	// payment monitoring - activates perks when payments are confirmed (only if gameId is provided)
	usePaymentPerkActivation({
		gameId: gameId || ('' as Id<'games'>),
		onActivatePerk: handlePerkActivation,
	});

	// animation loop management
	useGameAnimation({
		gameState,
		config,
		updateGameState,
	});

	// calculate current stats for display
	const currentStats: GameStats = useMemo(() => {
		//
		return calculateTerritoryStats(gameState.grid);
	}, [gameState.grid]);

	/**
	 * handles game start with callback
	 */
	const handleStart = () => {
		//
		startGame();
		onGameStart?.();
	};

	/**
	 * handles game stop with callback
	 */
	const handleStop = () => {
		//
		stopGame();
		onGameStop?.();
	};

	/**
	 * handles game reset with callback
	 */
	const handleReset = () => {
		//
		resetGame();
		onGameReset?.();
	};

	/**
	 * handles starting a new game (navigates back to config)
	 */
	const handleStartNewGame = () => {
		//
		navigate({ to: '/games/orbital-flux' });
	};

	// reinitialize game when config changes
	useEffect(() => {
		//
		initializeGame();
	}, [initializeGame]);

	// auto-start game if autoStart is enabled
	useEffect(() => {
		//
		if (autoStart && !gameState.isRunning && !gameState.winner) {
			const timer = setTimeout(() => {
				//
				handleStart();
			}, 100); // small delay to ensure game is initialized

			return () => clearTimeout(timer);
		}
	}, [autoStart, gameState.isRunning, gameState.winner, handleStart]);

	return (
		<div className="h-screen bg-background text-foreground overflow-hidden">
			<div className="h-full flex">
				{/* main arena - takes most of the screen */}
				<div className="flex-1 flex flex-col p-4 relative">
					{/* territory stats bar - above canvas */}
					<div className="mb-4">
						{customStatsBar || (
							<TerritoryStatsBar
								stats={currentStats}
								winner={gameState.winner}
								showStats={showStats}
								winThreshold={config.winThreshold}
							/>
						)}
					</div>

					{/* game content area - canvas and optional right panel */}
					<div className="flex-1 min-h-0 flex gap-4">
						{/* game canvas */}
						<div className="flex-1">
							<GameCanvas
								gameState={gameState}
								config={config}
								className="border-2 border-border bg-card rounded-lg shadow-2xl h-full"
							/>
						</div>

						{/* custom right panel */}
						{customRightPanel && <div className="flex-shrink-0">{customRightPanel}</div>}
					</div>

					{/* toggle button - bottom right corner */}
					{showSidebarToggle && (
						<Button
							onClick={toggleSidebar}
							variant="outline"
							size="sm"
							className="absolute bottom-6 right-6 z-10 bg-card border-border shadow-lg"
						>
							{isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
						</Button>
					)}
				</div>

				{/* right sidebar - controls and config */}
				{isSidebarOpen && (
					<div className="w-80 bg-card border-l border-border flex flex-col">
						{/* header with title and controls */}
						<div className="p-4 border-b border-border">
							<div className="flex items-center justify-between">
								<h1 className="text-xl font-bold text-foreground">Orbital Flux</h1>
								{!hideGameControls && (
									<>
										{gameState.winner ? (
											<Button onClick={handleStartNewGame} variant="default" size="sm">
												Start New Game
											</Button>
										) : gameState.isRunning ? (
											<Button onClick={handleStop} variant="outline" size="sm">
												<Pause className="w-4 h-4" />
												Pause
											</Button>
										) : (
											<Button onClick={handleStart} variant="default" size="sm">
												<Play className="w-4 h-4" />
												Resume
											</Button>
										)}
									</>
								)}
							</div>
						</div>

						{/* perks section */}
						<div className="flex-1 overflow-y-auto">
							{enablePerks && gameId && (
								<PerkPanel
									gameId={gameId}
									isRunning={gameState.isRunning}
									activeEffects={perkHost.activePerks}
									hasActiveEffect={perkHost.hasActiveEffect}
									canActivateEffect={perkHost.canActivateEffect}
									countActiveEffects={perkHost.countActiveEffects}
									onActivateEffect={perkHost.onActivateEffect}
									perkConfig={perkConfig}
								/>
							)}
						</div>

						{/* payments panel */}
						{gameId && <PaymentsPanel gameId={gameId} />}
					</div>
				)}
			</div>
		</div>
	);
}
