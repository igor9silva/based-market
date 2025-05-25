import { useCallback, useState } from 'react';
import type { ActiveEffect, Color, EffectType, GameConfig, GameState, PerkConfig, TempOrb } from '../types';
import { calculateTerritoryStats, generateNonRightAngleDirection } from '../utils';

interface UseGameStateProps {
	config: GameConfig;
	perkConfig: PerkConfig;
	onWinner?: (winner: string) => void;
	onTerritoryChange?: (stats: any) => void;
}

export function useGameState({ config, perkConfig, onWinner, onTerritoryChange }: UseGameStateProps) {
	//
	const [gameState, setGameState] = useState<GameState>({
		grid: [],
		orbs: [],
		blackCount: 0,
		whiteCount: 0,
		isRunning: false,
		winner: null,
		animationId: null,
		activeEffects: [],
	});

	/**
	 * initializes the game board with a 50/50 split and starting orbs
	 */
	const initializeGame = useCallback(() => {
		//
		const { gridWidth, gridHeight, orbSpeed, blockSize } = config;

		// create initial grid with 50/50 split (left white, right black)
		const grid: Color[][] = [];
		const splitPoint = Math.floor(gridWidth / 2);

		for (let y = 0; y < gridHeight; y++) {
			//
			grid[y] = [];
			for (let x = 0; x < gridWidth; x++) {
				grid[y][x] = x < splitPoint ? 'white' : 'black';
			}
		}

		// create orbs with non-right-angle initial directions
		const whiteDirection = generateNonRightAngleDirection(orbSpeed);
		const whiteOrb: TempOrb = {
			x: (splitPoint / 2) * blockSize + blockSize / 2,
			y: (gridHeight / 2) * blockSize + blockSize / 2,
			vx: whiteDirection.vx,
			vy: whiteDirection.vy,
			color: 'white',
			radius: blockSize * 0.4,
		};

		const blackDirection = generateNonRightAngleDirection(orbSpeed);
		const blackOrb: TempOrb = {
			x: (splitPoint + (gridWidth - splitPoint) / 2) * blockSize + blockSize / 2,
			y: (gridHeight / 2) * blockSize + blockSize / 2,
			vx: blackDirection.vx,
			vy: blackDirection.vy,
			color: 'black',
			radius: blockSize * 0.4,
		};

		const stats = calculateTerritoryStats(grid);

		setGameState({
			grid,
			orbs: [whiteOrb, blackOrb],
			blackCount: stats.blackCount,
			whiteCount: stats.whiteCount,
			isRunning: false,
			winner: null,
			animationId: null,
			activeEffects: [],
		});

		// notify parent of initial territory state
		onTerritoryChange?.(stats);
	}, [config, onTerritoryChange]);

	/**
	 * checks if a specific effect is currently active for a team
	 */
	const hasActiveEffect = useCallback(
		(effectType: string, side: string) => {
			//
			return gameState.activeEffects.some((effect) => effect.type === effectType && effect.side === side);
		},
		[gameState.activeEffects],
	);

	/**
	 * activates a perk effect for a specific team
	 */
	const activateEffect = useCallback(
		(effectType: EffectType, side: Color) => {
			//
			if (!gameState.isRunning) return;

			const now = Date.now();
			const duration = getDurationForEffect(effectType, perkConfig);

			const newEffect: ActiveEffect = {
				type: effectType,
				side,
				endTime: now + duration,
				id: `${effectType}-${side}-${now}`,
			};

			setGameState((prevState) => {
				//
				const newState = { ...prevState };

				// add the effect
				newState.activeEffects = [...prevState.activeEffects, newEffect];

				// apply immediate effect
				if (effectType === 'extra-orb') {
					//
					const tempOrb = createExtraOrb(side, newState.grid, config, now + duration);
					if (tempOrb) {
						newState.orbs = [...newState.orbs, tempOrb];
					}
				} else if (effectType === 'chaos-mode') {
					//
					// randomize all orb directions with non-right angles
					newState.orbs = newState.orbs.map((orb) => {
						//
						const direction = generateNonRightAngleDirection(config.orbSpeed * 1.5);
						return {
							...orb,
							vx: direction.vx,
							vy: direction.vy,
						};
					});
				}

				return newState;
			});
		},
		[gameState.isRunning, config, perkConfig],
	);

	/**
	 * updates the game state during animation loop
	 */
	const updateGameState = useCallback(
		(updater: (prevState: GameState) => GameState) => {
			//
			setGameState((prevState) => {
				//
				const newState = updater(prevState);

				// check for winner and notify parent
				if (newState.winner && !prevState.winner) {
					onWinner?.(newState.winner);
				}

				// notify parent of territory changes
				if (newState.blackCount !== prevState.blackCount || newState.whiteCount !== prevState.whiteCount) {
					//
					const stats = calculateTerritoryStats(newState.grid);
					onTerritoryChange?.(stats);
				}

				return newState;
			});
		},
		[onWinner, onTerritoryChange],
	);

	/**
	 * starts the game simulation
	 */
	const startGame = useCallback(() => {
		//
		setGameState((prev) => ({ ...prev, isRunning: true, winner: null }));
	}, []);

	/**
	 * stops the game simulation
	 */
	const stopGame = useCallback(() => {
		//
		setGameState((prev) => ({ ...prev, isRunning: false }));
	}, []);

	/**
	 * resets the game to initial state
	 */
	const resetGame = useCallback(() => {
		//
		initializeGame();
	}, [initializeGame]);

	return {
		gameState,
		initializeGame,
		hasActiveEffect,
		activateEffect,
		updateGameState,
		startGame,
		stopGame,
		resetGame,
	};
}

/**
 * gets the duration for a specific effect type
 */
function getDurationForEffect(effectType: EffectType, perkConfig: PerkConfig): number {
	//
	switch (effectType) {
		case 'extra-orb':
			return perkConfig.extraOrbDuration;
		case 'unbreakable':
			return perkConfig.unbreakableDuration;
		case 'speed-boost':
			return perkConfig.speedBoostDuration;
		case 'freeze-opponent':
			return perkConfig.freezeDuration;
		case 'chaos-mode':
			return perkConfig.chaosModeDuration;
		default:
			return 10000; // default 10 seconds
	}
}

/**
 * creates a temporary extra orb for a team
 */
function createExtraOrb(side: Color, grid: Color[][], config: GameConfig, endTime: number): TempOrb | null {
	//
	const { gridWidth, gridHeight, blockSize, orbSpeed } = config;

	// find a random position in the team's territory
	const teamBlocks = [];
	for (let y = 0; y < gridHeight; y++) {
		//
		for (let x = 0; x < gridWidth; x++) {
			if (grid[y][x] === side) {
				teamBlocks.push({ x, y });
			}
		}
	}

	if (teamBlocks.length === 0) return null;

	const randomBlock = teamBlocks[Math.floor(Math.random() * teamBlocks.length)];
	const direction = generateNonRightAngleDirection(orbSpeed);

	return {
		x: randomBlock.x * blockSize + blockSize / 2,
		y: randomBlock.y * blockSize + blockSize / 2,
		vx: direction.vx,
		vy: direction.vy,
		color: side,
		radius: blockSize * 0.35,
		isTemporary: true,
		endTime,
	};
}
