import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Square } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '~/components/ui/button';
import { DEFAULT_GAME_CONFIG, DEFAULT_PERK_CONFIG } from './constants';
import { useGameAnimation } from './hooks/useGameAnimation';
import { useGameState } from './hooks/useGameState';
import type { GameConfig, GameStats, OrbitalFluxProps, PerkConfig } from './types';
import { calculateTerritoryStats } from './utils';

// components
import { ConfigPanel } from './components/ConfigPanel';
import { GameCanvas } from './components/GameCanvas';
import { PerkPanel } from './components/PerkPanel';
import { TerritoryStatsBar } from './components/TerritoryStatsBar';

export default function OrbitalFlux({
	// initial configuration
	initialConfig = {},
	initialPerkConfig = {},
	// customization options
	enablePerks = true,
	enableConfigControls = true,
	showStats = true,
	// event callbacks
	onGameStart,
	onGameStop,
	onGameReset,
	onWinner,
	onTerritoryChange,
}: OrbitalFluxProps = {}) {
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

	// sidebar visibility from URL params
	const navigate = useNavigate();
	const search = useSearch({ from: '/games/orbital-flux' });
	const isSidebarOpen = !search.isExpanded; // isExpanded means sidebar is closed

	const toggleSidebar = () => {
		//
		navigate({
			to: '.',
			search: (prev) => ({ ...prev, isExpanded: !prev.isExpanded }),
		});
	};

	// game state management
	const {
		gameState,
		initializeGame,
		hasActiveEffect,
		canActivateEffect,
		countActiveEffects,
		activateEffect,
		updateGameState,
		startGame,
		stopGame,
		resetGame,
	} = useGameState({
		config,
		perkConfig,
		onWinner,
		onTerritoryChange,
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
	 * handles config changes and reinitializes game if needed
	 */
	const handleConfigChange = (newConfig: GameConfig) => {
		//
		setConfig(newConfig);
		// reinitialize game with new config if not running
		if (!gameState.isRunning) {
			// the useEffect below will handle reinitialization
		}
	};

	// reinitialize game when config changes
	useEffect(() => {
		//
		initializeGame();
	}, [initializeGame]);

	return (
		<div className="h-screen bg-background text-foreground overflow-hidden">
			<div className="h-full flex">
				{/* main arena - takes most of the screen */}
				<div className="flex-1 flex flex-col p-4 relative">
					{/* territory stats bar - above canvas */}
					<div className="mb-4">
						<TerritoryStatsBar
							stats={currentStats}
							winner={gameState.winner}
							showStats={showStats}
							winThreshold={config.winThreshold}
						/>
					</div>

					{/* game canvas - uses all remaining space */}
					<div className="flex-1 min-h-0">
						<GameCanvas
							gameState={gameState}
							config={config}
							className="border-2 border-border bg-card rounded-lg shadow-2xl"
						/>
					</div>

					{/* toggle button - bottom right corner */}
					<Button
						onClick={toggleSidebar}
						variant="outline"
						size="sm"
						className="absolute bottom-6 right-6 z-10 bg-card border-border shadow-lg"
					>
						{isSidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
					</Button>
				</div>

				{/* right sidebar - controls and config */}
				{isSidebarOpen && (
					<div className="w-80 bg-card border-l border-border flex flex-col">
						{/* header with title and stop button */}
						<div className="p-4 border-b border-border">
							<div className="flex items-center justify-between">
								<h1 className="text-xl font-bold text-foreground">Orbital Flux</h1>
								{gameState.isRunning && (
									<Button onClick={handleStop} variant="destructive" size="sm">
										<Square className="w-4 h-4" />
										Stop
									</Button>
								)}
							</div>
						</div>

						{/* configuration section - only show when not running */}
						{enableConfigControls && !gameState.isRunning && (
							<div className="p-4 border-b border-border">
								<ConfigPanel
									config={config}
									isRunning={gameState.isRunning}
									onConfigChange={handleConfigChange}
									onStart={handleStart}
								/>
							</div>
						)}

						{/* perks section */}
						<div className="flex-1 overflow-y-auto">
							{enablePerks && (
								<PerkPanel
									isRunning={gameState.isRunning}
									activeEffects={gameState.activeEffects}
									hasActiveEffect={hasActiveEffect}
									canActivateEffect={canActivateEffect}
									countActiveEffects={countActiveEffects}
									onActivateEffect={activateEffect}
								/>
							)}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
