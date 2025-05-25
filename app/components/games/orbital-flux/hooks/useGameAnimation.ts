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
			// give it a random nudge to break deadlock
			const nudgeAngle = Math.random() * 2 * Math.PI;
			const nudgeForce = 2;
			orb.vx += Math.cos(nudgeAngle) * nudgeForce;
			orb.vy += Math.sin(nudgeAngle) * nudgeForce;
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
		checkBoundaryCollision(orb, config);

		// check block collisions with previous position
		checkBlockCollision(orb, grid, prevX, prevY, config, activeEffects);

		// check orb-to-orb collisions to prevent overlapping
		checkOrbCollisions(orb, orbs, index);
	});
}

/**
 * checks and resolves collisions between orbs to prevent them from getting stuck together
 */
function checkOrbCollisions(currentOrb: TempOrb, allOrbs: TempOrb[], currentIndex: number): void {
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

			// calculate collision response (elastic collision)
			const relativeVx = currentOrb.vx - otherOrb.vx;
			const relativeVy = currentOrb.vy - otherOrb.vy;
			const relativeSpeed = relativeVx * (dx / distance) + relativeVy * (dy / distance);

			// only resolve if orbs are moving towards each other
			if (relativeSpeed < 0) {
				//
				const impulse = (2 * relativeSpeed) / 2; // assuming equal mass
				currentOrb.vx -= impulse * (dx / distance);
				currentOrb.vy -= impulse * (dy / distance);
				otherOrb.vx += impulse * (dx / distance);
				otherOrb.vy += impulse * (dy / distance);
			}
		}
	}
}
