import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_GAME_CONFIG, DEFAULT_PERK_CONFIG } from './constants';
import { useGameAnimation } from './hooks/useGameAnimation';
import { useGameState } from './hooks/useGameState';
import type { GameConfig, GameStats, OrbitalFluxProps, PerkConfig } from './types';
import { calculateTerritoryStats } from './utils';

// components
import { ConfigPanel } from './components/ConfigPanel';
import { GameCanvas } from './components/GameCanvas';
import { GameControls } from './components/GameControls';
import { PerkPanel } from './components/PerkPanel';
import { StatsPanel } from './components/StatsPanel';
import { TerritoryDisplay } from './components/TerritoryDisplay';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

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

	// game state management
	const {
		gameState,
		initializeGame,
		hasActiveEffect,
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
		<div className="min-h-screen bg-background p-4">
			<div className="max-w-6xl mx-auto">
				{/* header */}
				<div className="text-center mb-6">
					<h1 className="text-4xl font-bold text-foreground mb-2">Orbital Flux</h1>
					<p className="text-muted-foreground">Autonomous territorial simulation with dynamic orb physics</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* game canvas section */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<span>Simulation Arena</span>
									<GameControls
										isRunning={gameState.isRunning}
										onStart={handleStart}
										onStop={handleStop}
										onReset={handleReset}
									/>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex justify-center">
									<GameCanvas
										gameState={gameState}
										config={config}
										className="border border-border bg-card rounded-md"
									/>
								</div>
							</CardContent>
						</Card>
					</div>

					{/* controls and information panels */}
					<div className="space-y-6">
						{/* territory control display */}
						<TerritoryDisplay stats={currentStats} winner={gameState.winner} />

						{/* perk controls (optional) */}
						{enablePerks && (
							<PerkPanel
								isRunning={gameState.isRunning}
								activeEffects={gameState.activeEffects}
								hasActiveEffect={hasActiveEffect}
								onActivateEffect={activateEffect}
							/>
						)}

						{/* configuration controls (optional) */}
						{enableConfigControls && (
							<ConfigPanel
								config={config}
								isRunning={gameState.isRunning}
								onConfigChange={handleConfigChange}
							/>
						)}

						{/* statistics panel (optional) */}
						{showStats && <StatsPanel stats={currentStats} isRunning={gameState.isRunning} />}
					</div>
				</div>
			</div>
		</div>
	);
}
