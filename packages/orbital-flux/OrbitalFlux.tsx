import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '~/components/ui/button'; // Assuming this is a generic UI button
import { DEFAULT_GAME_CONFIG, DEFAULT_PERK_CONFIG } from './constants'; // Orbital Flux specific defaults
import { useGameAnimation } from './hooks/useGameAnimation';
import { useGameState } from './hooks/useGameState'; // Handles the core game simulation
import { usePaymentPerkActivation } from './hooks/usePaymentPerkActivation'; // Listens for perk payments
import { usePerkHost } from './hooks/usePerkHost'; // Manages perk activation with the backend
// Types are mostly Orbital Flux specific. For a truly generic component, these would need to be more abstract.
import type { EffectType, GameConfig, GameStats, OrbitalFluxProps, PerkConfig } from './types';
import { calculateTerritoryStats } from './utils'; // Orbital Flux specific utility

// UI Components specific to Orbital Flux
import { PaymentsPanel } from '~/../packages/orbital-flux/components/PaymentsPanel';
import { GameCanvas } from './components/GameCanvas';
import { PerkPanel } from './components/PerkPanel';
import { TerritoryStatsBar } from './components/TerritoryStatsBar';

/**
 * OrbitalFlux is the main component for the Orbital Flux game.
 * It integrates game state management, animation, perk handling, and backend communication.
 *
 * Props:
 * - initialConfig: Generic configuration object for the game. Defaults are merged with Orbital Flux defaults.
 * - initialPerkConfig: Configuration for perk durations, specific to Orbital Flux.
 * - gameId: ID of the game instance in the backend. Used for saving state and activating perks.
 * - enablePerks: Toggles the visibility and functionality of the perk system.
 * - showStats: Toggles the visibility of the statistics bar.
 * - autoStart: If true, the game starts automatically when the component mounts.
 * - customStatsBar: Allows providing a custom React node for the stats bar.
 * - customRightPanel: Allows providing a custom React node for the right panel (where perks/payments are shown).
 * - showSidebarToggle: Toggles visibility of the sidebar toggle button.
 * - hideGameControls: Hides the default start/pause/resume game controls.
 * - onGameStart, onGameStop, onGameReset, onWinner, onTerritoryChange, onGameStateChange: Callbacks for game events.
 */
export default function OrbitalFlux({
	// Initial configuration options
	initialConfig = {}, // Generic config, defaults to Orbital Flux's DEFAULT_GAME_CONFIG if keys match
	initialPerkConfig = {}, // Orbital Flux specific perk settings
	// Backend integration
	gameId, // The ID of the game instance this component is tied to
	// Customization options
	enablePerks = true,
	showStats = true,
	autoStart = false,
	customStatsBar,
	customRightPanel,
	showSidebarToggle = true,
	hideGameControls = false,
	// Event callbacks
	onGameStart,
	onGameStop,
	onGameReset,
	onWinner,
	onTerritoryChange,
	onGameStateChange,
}: OrbitalFluxProps) {
	// Merge initialConfig with Orbital Flux defaults.
	// The `config` state is `Record<string, any>` to support generic configurations,
	// but it's initialized with Orbital Flux defaults.
	// If `initialConfig` contains keys not in `DEFAULT_GAME_CONFIG`, they will also be included.
	const [config, setConfig] = useState<Record<string, any>>({
		...DEFAULT_GAME_CONFIG, // Base defaults for Orbital Flux
		...initialConfig, // Overrides and additions from props
	});

	// Perk configuration, currently specific to Orbital Flux.
	const [perkConfig] = useState<PerkConfig>({
		...DEFAULT_PERK_CONFIG,
		...initialPerkConfig,
	});

	// Convex mutation for finishing a game in the backend.
	const finishGameMutation = useMutation(api.games.public.finish);

	// Hook to manage client-side perk state and interaction with the backend.
	const perkHost = usePerkHost(gameId || ('' as Id<'games'>));

	// Router navigation and search params for UI state like sidebar visibility.
	const navigate = useNavigate();
	const search = useSearch({ strict: false }); // strict: false to allow unknown search params
	const isSidebarOpen = !search.isExpanded;

	const toggleSidebar = () => {
		navigate({
			to: '.', // Current route
			search: (prev: any) => ({ ...prev, isExpanded: !prev.isExpanded }), // Toggle isExpanded
		});
	};

	/**
	 * Handles the winner declaration.
	 * If a gameId is provided, it attempts to update the backend.
	 * Calls the onWinner prop callback.
	 */
	const handleWinner = async (winner: string) => {
		if (gameId) {
			try {
				await finishGameMutation({ gameId, winner: winner as 'white' | 'black' });
			} catch (error) {
				console.error('Failed to finish game in backend:', error);
			}
		}
		onWinner?.(winner);
	};

	// Core game state logic (grid, orbs, effects, etc.)
	// `useGameState` is passed the generic `config` and Orbital Flux specific `perkConfig`.
	const { gameState, initializeGame, updateGameState, startGame, stopGame, resetGame, activateEffect } = useGameState(
		{
			config, // The merged game configuration
			perkConfig, // Orbital Flux specific perk settings
			onWinner: handleWinner,
			onTerritoryChange,
		},
	);

	/**
	 * Activates a perk effect.
	 * Updates the local game state immediately if the game is running.
	 * Persists the perk activation to the backend via `perkHost`.
	 */
	const handlePerkActivation = useCallback(
		async (type: EffectType, side: 'white' | 'black' | 'neutral', duration: number) => {
			if (gameState.isRunning) {
				activateEffect(type as any, side as any); // Activate locally
			}
			// Activate on the backend (if gameId is present)
			if (gameId) {
				await perkHost.activatePerk(type, side, duration);
			}
		},
		[activateEffect, perkHost.activatePerk, gameState.isRunning, gameId], // Added gameId to dependencies
	);

	// Listens for payment confirmations and activates perks accordingly.
	usePaymentPerkActivation({
		gameId: gameId || ('' as Id<'games'>), // Ensure gameId is valid or an empty string
		onActivatePerk: handlePerkActivation,
	});

	// Manages the game's animation loop using requestAnimationFrame.
	useGameAnimation({
		gameState,
		config, // Pass the generic config
		updateGameState,
	});

	// Calculates and memoizes current territory statistics.
	const currentStats: GameStats = useMemo(() => {
		return calculateTerritoryStats(gameState.grid); // Orbital Flux specific calculation
	}, [gameState.grid]);

	/**
	 * Handles game start action and calls the onGameStart callback.
	 */
	const handleStart = () => {
		startGame();
		onGameStart?.();
	};

	/**
	 * Handles game stop action and calls the onGameStop callback.
	 */
	const handleStop = () => {
		stopGame();
		onGameStop?.();
	};

	/**
	 * Handles game reset action and calls the onGameReset callback.
	 */
	const handleReset = () => {
		resetGame();
		onGameReset?.();
	};

	/**
	 * Handles navigation to start a new game, typically back to the game's configuration page.
	 * Assumes 'orbital-flux' as the gameSlug for now. This might need to be dynamic if OrbitalFlux
	 * component is used in a context where gameSlug can vary.
	 */
	const handleStartNewGame = () => {
		// TODO: Make gameSlug dynamic if this component needs to support other games directly.
		navigate({ to: '/games/$gameSlug', params: { gameSlug: 'orbital-flux' } });
	};

	// Re-initialize the game if the config changes externally.
	// Note: `initializeGame` depends on `config` from `useGameState`, which means
	// if `setConfig` is called here, it might cause re-initialization.
	// However, `config` in `OrbitalFlux` is initialized once and not changed by `setConfig` here.
	useEffect(() => {
		initializeGame();
	}, [initializeGame]); // initializeGame itself depends on config from useGameState

	// Auto-starts the game if `autoStart` prop is true and game is not already running or finished.
	useEffect(() => {
		if (autoStart && !gameState.isRunning && !gameState.winner) {
			const timer = setTimeout(() => {
				handleStart();
			}, 100); // Small delay to ensure initialization
			return () => clearTimeout(timer);
		}
	}, [autoStart, gameState.isRunning, gameState.winner, handleStart]); // handleStart has startGame which has config

	// Notifies parent component of game state changes.
	useEffect(() => {
		onGameStateChange?.(gameState);
	}, [gameState, onGameStateChange]);

	return (
		<div className="h-full bg-background text-foreground overflow-hidden">
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
