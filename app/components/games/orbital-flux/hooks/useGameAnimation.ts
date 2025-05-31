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
	onTerritoryCapture?: (color: 'white' | 'black') => void;
	onOrbBounce?: (intensity?: number) => void;
	onOrbCollision?: () => void;
}

export function useGameAnimation({
	gameState,
	config,
	updateGameState,
	onTerritoryCapture,
	onOrbBounce,
	onOrbCollision,
}: UseGameAnimationProps) {
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

			// check if chaos mode just ended
			const hadChaosMode = prevState.activeEffects.some((effect) => effect.type === 'chaos');
			const hasChaosMode = activeEffects.some((effect) => effect.type === 'chaos');

			// if chaos mode just ended, restore orbs to their base directions
			if (hadChaosMode && !hasChaosMode) {
				//
				orbs.forEach((orb) => {
					// restore original direction at base speed
					orb.vx = orb.baseDirection.vx * orb.baseSpeed;
					orb.vy = orb.baseDirection.vy * orb.baseSpeed;
				});
			}

			const newGrid = prevState.grid.map((row) => [...row]);
			const newOrbs = orbs.map((orb) => ({ ...orb }));

			// update orb physics
			updateOrbPhysics(newOrbs, newGrid, config, activeEffects, onTerritoryCapture, onOrbBounce, onOrbCollision);

			// calculate territory statistics
			const stats = calculateTerritoryStats(newGrid);

			// check win conditions
			const winResult = checkWinConditions(
				stats.blackCount,
				stats.whiteCount,
				stats.totalBlocks,
				config.winThreshold,
			);

			const { winner, percentage } = winResult || {};

			return {
				...prevState,
				grid: newGrid,
				orbs: newOrbs,
				blackCount: stats.blackCount,
				whiteCount: stats.whiteCount,
				winner,
				winPercent: percentage,
				isRunning: !winResult,
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
function updateOrbPhysics(
	orbs: TempOrb[],
	grid: any[][],
	config: GameConfig,
	activeEffects: any[],
	onTerritoryCapture?: (color: 'white' | 'black') => void,
	onOrbBounce?: (intensity?: number) => void,
	onOrbCollision?: () => void,
): void {
	//
	orbs.forEach((orb, index) => {
		//
		// store previous position for collision detection
		const prevX = orb.x;
		const prevY = orb.y;

		// check if orb is frozen
		if (isOrbFrozen(orb, activeEffects)) return;

		// deadlock detection - if orb hasn't moved significantly in a while, give it a nudge
		if (!orb.lastMoveTime) orb.lastMoveTime = Date.now();
		if (!orb.lastPosition) orb.lastPosition = { x: orb.x, y: orb.y };

		const timeSinceLastMove = Date.now() - orb.lastMoveTime;
		const distanceMoved = Math.sqrt(
			Math.pow(orb.x - orb.lastPosition.x, 2) + Math.pow(orb.y - orb.lastPosition.y, 2),
		);

		// if orb hasn't moved much in 2 seconds, it might be stuck
		if (timeSinceLastMove > 2000 && distanceMoved < 5) {
			//
			// give it a temporary directional nudge to break deadlock (don't modify base speed)
			const nudgeAngle = Math.random() * 2 * Math.PI;
			const nudgeDirection = {
				vx: Math.cos(nudgeAngle),
				vy: Math.sin(nudgeAngle),
			};

			// set velocity to nudge direction at base speed
			orb.vx = nudgeDirection.vx * orb.baseSpeed;
			orb.vy = nudgeDirection.vy * orb.baseSpeed;
			orb.lastMoveTime = Date.now();
			orb.lastPosition = { x: orb.x, y: orb.y };
		} else if (distanceMoved > 10) {
			//
			// orb is moving normally, update tracking
			orb.lastMoveTime = Date.now();
			orb.lastPosition = { x: orb.x, y: orb.y };
		}

		// apply speed modifications
		const speedMultiplier = getSpeedMultiplier(orb, activeEffects);

		// move orb with speed modification
		orb.x += orb.vx * speedMultiplier;
		orb.y += orb.vy * speedMultiplier;

		// check boundary collisions first
		checkBoundaryCollision(orb, config, onOrbBounce);

		// check block collisions with previous position
		checkBlockCollision(orb, grid, prevX, prevY, config, activeEffects, onTerritoryCapture, onOrbBounce);

		// check orb-to-orb collisions to prevent overlapping
		checkOrbCollisions(orb, orbs, index, onOrbCollision);

		// ensure velocity magnitude stays close to base speed after collisions
		const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
		if (currentSpeed > 0 && Math.abs(currentSpeed - orb.baseSpeed) > 0.1) {
			//
			const scale = orb.baseSpeed / currentSpeed;
			orb.vx *= scale;
			orb.vy *= scale;
		}
	});
}

/**
 * checks and resolves collisions between orbs to prevent them from getting stuck together
 */
function checkOrbCollisions(
	currentOrb: TempOrb,
	allOrbs: TempOrb[],
	currentIndex: number,
	onOrbCollision?: () => void,
): void {
	//
	for (let i = 0; i < allOrbs.length; i++) {
		//
		if (i === currentIndex) continue;

		const otherOrb = allOrbs[i];
		const dx = currentOrb.x - otherOrb.x;
		const dy = currentOrb.y - otherOrb.y;
		const distance = Math.sqrt(dx * dx + dy * dy);
		const minDistance = currentOrb.radius + otherOrb.radius;

		// if orbs are overlapping or too close
		if (distance < minDistance && distance > 0) {
			//
			// calculate separation vector
			const separationX = (dx / distance) * (minDistance - distance) * 0.5;
			const separationY = (dy / distance) * (minDistance - distance) * 0.5;

			// separate the orbs
			currentOrb.x += separationX;
			currentOrb.y += separationY;
			otherOrb.x -= separationX;
			otherOrb.y -= separationY;

			// instead of modifying velocities permanently, apply a temporary deflection
			// that maintains base speeds
			const deflectionAngle1 = Math.atan2(dy, dx);
			const deflectionAngle2 = deflectionAngle1 + Math.PI;

			// set velocities to deflection directions at base speeds
			currentOrb.vx = Math.cos(deflectionAngle1) * currentOrb.baseSpeed;
			currentOrb.vy = Math.sin(deflectionAngle1) * currentOrb.baseSpeed;
			otherOrb.vx = Math.cos(deflectionAngle2) * otherOrb.baseSpeed;
			otherOrb.vy = Math.sin(deflectionAngle2) * otherOrb.baseSpeed;

			// play collision sound
			onOrbCollision?.();
		}
	}
}
