import { useCallback, useState } from 'react';
// Types are mostly Orbital Flux specific.
import type { ActiveEffect, Color, EffectType, GameState, PerkConfig, TempOrb } from '../types';
// Utilities are Orbital Flux specific.
import { calculateTerritoryStats, generateNonRightAngleDirection } from '../utils';

interface UseGameStateProps {
	config: Record<string, any>; // Generic game configuration
	perkConfig: PerkConfig; // Orbital Flux specific perk configuration
	onWinner?: (winner: 'white' | 'black') => void;
	onTerritoryChange?: (stats: any) => void; // Stats object structure might be game-specific
}

/**
 * Custom hook for managing the core game state and logic of Orbital Flux.
 * It handles game initialization, state updates, perk activation effects, and win conditions.
 *
 * @param config - Generic game configuration. Consumed as `any` here, expecting Orbital Flux properties.
 * @param perkConfig - Orbital Flux specific perk durations and settings.
 * @param onWinner - Callback when a winner is determined.
 * @param onTerritoryChange - Callback when territory stats change.
 */
export function useGameState({ config, perkConfig, onWinner, onTerritoryChange }: UseGameStateProps) {
	// Cast config to `any` to access Orbital Flux specific properties.
	// This hook is tightly coupled with Orbital Flux logic.
	// For other games, a different game state hook would be needed.
	const gameConfig = config as any;

	const [gameState, setGameState] = useState<GameState>({
		grid: [], // Represents the game board
		orbs: [], // List of active orbs
		blackCount: 0,
		whiteCount: 0,
		isRunning: false,
		winner: undefined,
		animationId: null,
		activeEffects: [],
		startTime: undefined,
	});

	/**
	 * initializes the game board with a 50/50 split and starting orbs
	 */
	const initializeGame = useCallback(() => {
		//
		const { gridWidth, gridHeight, orbSpeed, blockSize } = gameConfig;

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
			baseSpeed: orbSpeed,
			baseDirection: whiteDirection.baseDirection,
			color: 'white',
			radius: blockSize * 0.4,
		};

		const blackDirection = generateNonRightAngleDirection(orbSpeed);
		const blackOrb: TempOrb = {
			x: (splitPoint + (gridWidth - splitPoint) / 2) * blockSize + blockSize / 2,
			y: (gridHeight / 2) * blockSize + blockSize / 2,
			vx: blackDirection.vx,
			vy: blackDirection.vy,
			baseSpeed: orbSpeed,
			baseDirection: blackDirection.baseDirection,
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
			winner: undefined,
			animationId: null,
			activeEffects: [],
			startTime: undefined,
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
	 * counts active effects for a specific side
	 */
	const countActiveEffects = useCallback(
		(side: string) => {
			//
			const now = Date.now();
			return gameState.activeEffects.filter((effect) => effect.side === side && effect.endTime > now).length;
		},
		[gameState.activeEffects],
	);

	/**
	 * checks if a side can activate more effects (max 5 per side, chaos counts for both)
	 */
	const canActivateEffect = useCallback(
		(effectType: EffectType, side: Color) => {
			//
			if (effectType === 'chaos') {
				// chaos mode counts against both sides' limits and cannot stack
				const whiteCount = countActiveEffects('white');
				const blackCount = countActiveEffects('black');
				const chaosCount = countActiveEffects('neutral');

				// cannot activate if chaos is already active or if either side is at limit
				return chaosCount === 0 && whiteCount + chaosCount < 5 && blackCount + chaosCount < 5;
			} else if (effectType === 'extra-orb') {
				// extra orbs can stack - just check slot availability
				const sideCount = countActiveEffects(side);
				const chaosCount = countActiveEffects('neutral');

				// can activate if this side has room (considering chaos effects)
				return sideCount + chaosCount < 5;
			} else {
				// other effects cannot stack - check if already active
				const sideCount = countActiveEffects(side);
				const chaosCount = countActiveEffects('neutral');
				const hasThisEffect = hasActiveEffect(effectType, side);

				// can activate if not already active and has room
				return !hasThisEffect && sideCount + chaosCount < 5;
			}
		},
		[countActiveEffects, hasActiveEffect],
	);

	/**
	 * activates a perk effect for a specific team
	 */
	const activateEffect = useCallback(
		(effectType: EffectType, side: Color) => {
			//
			if (!gameState.isRunning) return;
			if (!canActivateEffect(effectType, side)) return;

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
					const tempOrb = createExtraOrb(side, newState.grid, gameConfig, now + duration);
					if (tempOrb) {
						newState.orbs = [...newState.orbs, tempOrb];
					}
				} else if (effectType === 'chaos') {
					// Randomize all orb directions
					newState.orbs = newState.orbs.map((orb) => {
						const direction = generateNonRightAngleDirection(orb.baseSpeed);
						return {
							...orb,
							vx: direction.vx,
							vy: direction.vy,
						};
					});
					// Add extra orbs for chaos mode
					const chaosOrbs: TempOrb[] = [];
					for (let i = 0; i < 3; i++) {
						const whiteOrb = createExtraOrb('white', newState.grid, gameConfig, now + duration);
						if (whiteOrb) chaosOrbs.push(whiteOrb);
						const blackOrb = createExtraOrb('black', newState.grid, gameConfig, now + duration);
						if (blackOrb) chaosOrbs.push(blackOrb);
					}
					newState.orbs = [...newState.orbs, ...chaosOrbs];
				}

				return newState;
			});
		},
		[gameState.isRunning, gameConfig, perkConfig, canActivateEffect],
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
		setGameState((prev) => {
			const now = Date.now();

			// if there was a winner, reset the game completely
			if (prev.winner) {
				// reset to fresh game state and start immediately
				const { gridWidth, gridHeight, orbSpeed, blockSize } = gameConfig;

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
					baseSpeed: orbSpeed,
					baseDirection: whiteDirection.baseDirection,
					color: 'white',
					radius: blockSize * 0.4,
				};

				const blackDirection = generateNonRightAngleDirection(orbSpeed);
				const blackOrb: TempOrb = {
					x: (splitPoint + (gridWidth - splitPoint) / 2) * blockSize + blockSize / 2,
					y: (gridHeight / 2) * blockSize + blockSize / 2,
					vx: blackDirection.vx,
					vy: blackDirection.vy,
					baseSpeed: orbSpeed,
					baseDirection: blackDirection.baseDirection,
					color: 'black',
					radius: blockSize * 0.4,
				};

				const stats = calculateTerritoryStats(grid);

				return {
					grid,
					orbs: [whiteOrb, blackOrb],
					blackCount: stats.blackCount,
					whiteCount: stats.whiteCount,
					isRunning: true,
					winner: undefined,
					animationId: null,
					activeEffects: [],
					startTime: now,
				};
			}
			// otherwise just start the current game
			return { ...prev, isRunning: true, winner: undefined, startTime: prev.startTime || now };
		});
	}, [gameConfig]);

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
		canActivateEffect,
		countActiveEffects,
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
		case 'freeze-enemy':
			return perkConfig.freezeDuration;
		case 'chaos':
			return perkConfig.chaosModeDuration;
		default:
			return 10000; // default 10 seconds
	}
}

/**
 * Creates a temporary extra orb for a team.
 * Specific to Orbital Flux mechanics.
 */
function createExtraOrb(side: Color, grid: Color[][], gameConfig: Record<string, any>, endTime: number): TempOrb | null {
	const { gridWidth, gridHeight, blockSize, orbSpeed } = gameConfig as any;

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
		baseSpeed: orbSpeed,
		baseDirection: direction.baseDirection,
		color: side,
		radius: blockSize * 0.35,
		isTemporary: true,
		endTime,
	};
}
