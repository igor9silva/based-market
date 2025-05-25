import { useCallback, useEffect, useRef } from 'react';
import type { GameConfig, GameState, TempOrb } from '../types';
import {
	calculateTerritoryStats,
	checkBlockCollision,
	checkBoundaryCollision,
	checkWinConditions,
	getSpeedMultiplier,
	isOrbFrozen,
} from '../utils';

interface UseGameAnimationProps {
	gameState: GameState;
	config: GameConfig;
	updateGameState: (updater: (prevState: GameState) => GameState) => void;
}

export function useGameAnimation({ gameState, config, updateGameState }: UseGameAnimationProps) {
	//
	const animationRef = useRef<number>();

	/**
	 * main animation loop that handles physics and game logic
	 */
	const animate = useCallback(() => {
		//
		updateGameState((prevState) => {
			//
			if (!prevState.isRunning || prevState.winner) return prevState;

			const now = Date.now();

			// clean up expired effects and temporary orbs
			const activeEffects = prevState.activeEffects.filter((effect) => effect.endTime > now);
			const orbs = prevState.orbs.filter((orb) => !orb.isTemporary || (orb.endTime && orb.endTime > now));

			const newGrid = prevState.grid.map((row) => [...row]);
			const newOrbs = orbs.map((orb) => ({ ...orb }));

			// update orb physics
			updateOrbPhysics(newOrbs, newGrid, config, activeEffects);

			// calculate territory statistics
			const stats = calculateTerritoryStats(newGrid);

			// check win conditions
			const winner = checkWinConditions(
				stats.blackCount,
				stats.whiteCount,
				stats.totalBlocks,
				config.winThreshold,
			);

			return {
				...prevState,
				grid: newGrid,
				orbs: newOrbs,
				blackCount: stats.blackCount,
				whiteCount: stats.whiteCount,
				winner,
				isRunning: !winner,
				activeEffects,
			};
		});

		// continue animation if game is still running
		if (gameState.isRunning && !gameState.winner) {
			animationRef.current = requestAnimationFrame(animate);
		}
	}, [config, gameState.isRunning, gameState.winner, updateGameState]);

	/**
	 * starts the animation loop when the game is running
	 */
	useEffect(() => {
		//
		if (gameState.isRunning && !gameState.winner) {
			animationRef.current = requestAnimationFrame(animate);
		}

		return () => {
			//
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [gameState.isRunning, gameState.winner, animate]);

	/**
	 * cleanup animation on unmount
	 */
	useEffect(() => {
		//
		return () => {
			//
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, []);

	return {
		// expose animation ref for manual control if needed
		animationRef,
	};
}

/**
 * updates physics for all orbs including movement, collisions, and effects
 */
function updateOrbPhysics(orbs: TempOrb[], grid: any[][], config: GameConfig, activeEffects: any[]): void {
	//
	orbs.forEach((orb) => {
		//
		// store previous position for collision detection
		const prevX = orb.x;
		const prevY = orb.y;

		// check if orb is frozen
		if (isOrbFrozen(orb, activeEffects)) return;

		// apply speed modifications
		const speedMultiplier = getSpeedMultiplier(orb, activeEffects);

		// move orb with speed modification
		orb.x += orb.vx * speedMultiplier;
		orb.y += orb.vy * speedMultiplier;

		// check boundary collisions first
		checkBoundaryCollision(orb, config);

		// check block collisions with previous position
		checkBlockCollision(orb, grid, prevX, prevY, config, activeEffects);
	});
}
