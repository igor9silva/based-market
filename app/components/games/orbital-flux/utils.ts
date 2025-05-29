import { RIGHT_ANGLE_TOLERANCE, SPEED_MULTIPLIERS } from './constants';
import type { ActiveEffect, Color, GameConfig, TempOrb } from './types';

/**
 * generates a random direction vector that avoids right angles
 * this prevents orbs from moving in perfectly horizontal/vertical lines
 */
export function generateNonRightAngleDirection(speed: number) {
	//
	let angle;
	do {
		angle = Math.random() * 2 * Math.PI;
	} while (
		// avoid angles close to 0°, 90°, 180°, 270° (±15° tolerance)
		Math.abs(angle % (Math.PI / 2)) < RIGHT_ANGLE_TOLERANCE ||
		Math.abs(angle % (Math.PI / 2)) > Math.PI / 2 - RIGHT_ANGLE_TOLERANCE
	);

	const vx = Math.cos(angle) * speed;
	const vy = Math.sin(angle) * speed;

	return {
		vx,
		vy,
		// normalized direction (for preserving original direction)
		baseDirection: {
			vx: Math.cos(angle),
			vy: Math.sin(angle),
		},
	};
}

/**
 * checks for collision between an orb and blocks in the grid using ray-casting
 * this prevents orbs from "tunneling" through blocks at high speeds
 */
export function checkBlockCollision(
	orb: TempOrb,
	grid: Color[][],
	prevX: number,
	prevY: number,
	config: GameConfig,
	activeEffects: ActiveEffect[],
): boolean {
	//
	const { gridWidth, gridHeight, blockSize } = config;

	// calculate the movement vector
	const dx = orb.x - prevX;
	const dy = orb.y - prevY;
	const distance = Math.sqrt(dx * dx + dy * dy);

	if (distance === 0) return false;

	// normalize the direction vector
	const dirX = dx / distance;
	const dirY = dy / distance;

	// step along the path in small increments to detect collisions
	const stepSize = Math.min(blockSize / 4, distance / 10);
	const steps = Math.ceil(distance / stepSize);

	// safety limit to prevent infinite loops
	const maxSteps = Math.min(steps, 50);

	for (let step = 0; step <= maxSteps; step++) {
		//
		const checkX = prevX + dirX * stepSize * step;
		const checkY = prevY + dirY * stepSize * step;

		// don't check beyond the current position
		if (step * stepSize > distance) break;

		const gridX = Math.floor(checkX / blockSize);
		const gridY = Math.floor(checkY / blockSize);

		if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
			//
			const blockColor = grid[gridY][gridX];

			// only convert if it's the opposing color
			if (blockColor !== orb.color) {
				//
				// check if the block's color has unbreakable effect
				const hasUnbreakable = activeEffects.some(
					(effect) =>
						effect.type === 'unbreakable' && effect.side === blockColor && effect.endTime > Date.now(),
				);

				// calculate precise collision point and reflection
				const intersections = calculateBlockIntersections(
					prevX,
					prevY,
					dirX,
					dirY,
					distance,
					gridX,
					gridY,
					blockSize,
				);

				if (intersections.length > 0) {
					//
					const closest = intersections.reduce((min, curr) => (curr.t < min.t ? curr : min));

					// position orb at collision point
					orb.x = closest.x;
					orb.y = closest.y;

					// reflect based on which edge was hit
					if (closest.edge === 'left' || closest.edge === 'right') {
						orb.vx = -orb.vx;
					} else {
						orb.vy = -orb.vy;
					}

					// convert block if not unbreakable
					if (!hasUnbreakable) {
						grid[gridY][gridX] = orb.color;
					}

					return true;
				}
			}
		}
	}
	return false;
}

/**
 * calculates intersection points between orb path and block edges
 */
function calculateBlockIntersections(
	prevX: number,
	prevY: number,
	dirX: number,
	dirY: number,
	distance: number,
	gridX: number,
	gridY: number,
	blockSize: number,
) {
	//
	const blockLeft = gridX * blockSize;
	const blockRight = (gridX + 1) * blockSize;
	const blockTop = gridY * blockSize;
	const blockBottom = (gridY + 1) * blockSize;

	const intersections = [];

	// check intersection with each edge of the block
	// left edge
	if (dirX > 0) {
		//
		const t = (blockLeft - prevX) / dirX;
		const y = prevY + dirY * t;
		if (t >= 0 && t <= distance / Math.abs(dirX) && y >= blockTop && y <= blockBottom) {
			intersections.push({ t, edge: 'left', x: blockLeft, y });
		}
	}

	// right edge
	if (dirX < 0) {
		//
		const t = (blockRight - prevX) / dirX;
		const y = prevY + dirY * t;
		if (t >= 0 && t <= distance / Math.abs(dirX) && y >= blockTop && y <= blockBottom) {
			intersections.push({ t, edge: 'right', x: blockRight, y });
		}
	}

	// top edge
	if (dirY > 0) {
		//
		const t = (blockTop - prevY) / dirY;
		const x = prevX + dirX * t;
		if (t >= 0 && t <= distance / Math.abs(dirY) && x >= blockLeft && x <= blockRight) {
			intersections.push({ t, edge: 'top', x, y: blockTop });
		}
	}

	// bottom edge
	if (dirY < 0) {
		//
		const t = (blockBottom - prevY) / dirY;
		const x = prevX + dirX * t;
		if (t >= 0 && t <= distance / Math.abs(dirY) && x >= blockLeft && x <= blockRight) {
			intersections.push({ t, edge: 'bottom', x, y: blockBottom });
		}
	}

	return intersections;
}

/**
 * checks and handles collision with canvas boundaries
 */
export function checkBoundaryCollision(orb: TempOrb, config: GameConfig): void {
	//
	const { gridWidth, gridHeight, blockSize } = config;
	const canvasWidth = gridWidth * blockSize;
	const canvasHeight = gridHeight * blockSize;

	if (orb.x - orb.radius <= 0 || orb.x + orb.radius >= canvasWidth) {
		orb.vx = -orb.vx;
		orb.x = Math.max(orb.radius, Math.min(canvasWidth - orb.radius, orb.x));
	}

	if (orb.y - orb.radius <= 0 || orb.y + orb.radius >= canvasHeight) {
		orb.vy = -orb.vy;
		orb.y = Math.max(orb.radius, Math.min(canvasHeight - orb.radius, orb.y));
	}

	// velocity limiter to prevent orbs from getting too fast, but preserve base speed
	const maxSpeed = orb.baseSpeed * 3; // allow up to 3x base speed
	const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);
	if (currentSpeed > maxSpeed) {
		//
		const scale = maxSpeed / currentSpeed;
		orb.vx *= scale;
		orb.vy *= scale;
	}
}

/**
 * calculates territory statistics from the current grid state
 */
export function calculateTerritoryStats(grid: Color[][]) {
	//
	const blackCount = grid.flat().filter((cell) => cell === 'black').length;
	const whiteCount = grid.flat().filter((cell) => cell === 'white').length;
	const totalBlocks = blackCount + whiteCount;

	return {
		blackCount,
		whiteCount,
		totalBlocks,
		blackPercentage: totalBlocks > 0 ? (blackCount / totalBlocks) * 100 : 0,
		whitePercentage: totalBlocks > 0 ? (whiteCount / totalBlocks) * 100 : 0,
	};
}

/**
 * checks if an orb should be frozen based on active effects
 */
export function isOrbFrozen(orb: TempOrb, activeEffects: ActiveEffect[]): boolean {
	//
	const now = Date.now();
	return activeEffects.some(
		(effect) =>
			effect.type === 'freeze-enemy' &&
			((effect.side === 'white' && orb.color === 'black') ||
				(effect.side === 'black' && orb.color === 'white')) &&
			effect.endTime > now,
	);
}

/**
 * checks if an orb has speed boost effect
 */
export function hasSpeedBoost(orb: TempOrb, activeEffects: ActiveEffect[]): boolean {
	//
	const now = Date.now();
	return activeEffects.some(
		(effect) => effect.type === 'speed-boost' && effect.side === orb.color && effect.endTime > now,
	);
}

/**
 * checks if chaos mode is currently active
 */
export function hasChaosMode(activeEffects: ActiveEffect[]): boolean {
	//
	const now = Date.now();
	return activeEffects.some((effect) => effect.type === 'chaos' && effect.endTime > now);
}

/**
 * gets the appropriate speed multiplier for an orb based on active effects
 */
export function getSpeedMultiplier(orb: TempOrb, activeEffects: ActiveEffect[]): number {
	//
	if (hasChaosMode(activeEffects)) {
		return SPEED_MULTIPLIERS.chaosMode;
	}
	if (hasSpeedBoost(orb, activeEffects)) {
		return SPEED_MULTIPLIERS.speedBoost;
	}
	return SPEED_MULTIPLIERS.normal;
}

/**
 * checks win conditions and returns winner message if applicable
 */
export function checkWinConditions(
	blackCount: number,
	whiteCount: number,
	totalBlocks: number,
	winThreshold: number,
): {
	winner: 'white' | 'black';
	percentage: number;
} | null {
	//
	const blackPercentage = (blackCount / totalBlocks) * 100;
	const whitePercentage = (whiteCount / totalBlocks) * 100;

	if (blackPercentage >= winThreshold) {
		return {
			winner: 'black',
			percentage: blackPercentage,
		};
	} else if (whitePercentage >= winThreshold) {
		return {
			winner: 'white',
			percentage: whitePercentage,
		};
	} else if (blackCount === 0) {
		return {
			winner: 'white',
			percentage: 100,
		};
	} else if (whiteCount === 0) {
		return {
			winner: 'black',
			percentage: 100,
		};
	}

	return null;
}

/**
 * normalizes an orb's velocity to maintain its base speed
 * this preserves the original intended speed while allowing direction changes
 */
export function normalizeOrbVelocity(orb: TempOrb): void {
	//
	const currentSpeed = Math.sqrt(orb.vx * orb.vx + orb.vy * orb.vy);

	// if speed is too different from base speed, normalize it
	if (currentSpeed > 0 && Math.abs(currentSpeed - orb.baseSpeed) > 0.1) {
		//
		const scale = orb.baseSpeed / currentSpeed;
		orb.vx *= scale;
		orb.vy *= scale;
	}
}

/**
 * resets an orb's velocity to its original base direction and speed
 * used to restore original movement after temporary effects
 */
export function resetOrbToBaseVelocity(orb: TempOrb): void {
	//
	orb.vx = orb.baseDirection.vx * orb.baseSpeed;
	orb.vy = orb.baseDirection.vy * orb.baseSpeed;
}
