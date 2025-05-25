import { useCallback, useEffect, useRef } from 'react';
import type { GameConfig, GameState } from '../types';
import { hasSpeedBoost, isOrbFrozen } from '../utils';

interface GameCanvasProps {
	gameState: GameState;
	config: GameConfig;
	className?: string;
}

export function GameCanvas({ gameState, config, className }: GameCanvasProps) {
	//
	const canvasRef = useRef<HTMLCanvasElement>(null);

	/**
	 * renders the complete game state to the canvas
	 */
	const render = useCallback(() => {
		//
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { gridWidth, gridHeight, blockSize } = config;

		// clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// get theme-aware colors
		const colors = getThemeColors();

		// render grid blocks
		renderGrid(ctx, gameState.grid, blockSize, colors);

		// render orbs with effect indicators
		renderOrbs(ctx, gameState.orbs, gameState.activeEffects, colors);
	}, [config, gameState.grid, gameState.orbs, gameState.activeEffects]);

	/**
	 * re-render when game state changes
	 */
	useEffect(() => {
		//
		render();
	}, [render]);

	return (
		<canvas
			ref={canvasRef}
			width={config.gridWidth * config.blockSize}
			height={config.gridHeight * config.blockSize}
			className={className}
		/>
	);
}

/**
 * gets theme-aware color palette
 */
function getThemeColors() {
	//
	const isDark = document.documentElement.classList.contains('dark');

	return {
		white: '#ffffff',
		black: '#000000',
		neutral: isDark ? '#666666' : '#999999',
		gridLine: isDark ? 'hsl(240 3.7% 15.9%)' : 'hsl(240 5.9% 90%)',
		speedBoost: '#ff6b35',
		frozen: '#00bcd4',
		temporary: '#ffd700',
		unbreakable: '#9c27b0',
	};
}

/**
 * renders the grid blocks with territory colors
 */
function renderGrid(ctx: CanvasRenderingContext2D, grid: any[][], blockSize: number, colors: any): void {
	//
	grid.forEach((row, y) => {
		//
		row.forEach((cell, x) => {
			//
			// fill block with territory color
			ctx.fillStyle = colors[cell as keyof typeof colors];
			ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

			// draw grid lines for visual separation
			ctx.strokeStyle = colors.gridLine;
			ctx.lineWidth = 0.5;
			ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
		});
	});
}

/**
 * renders orbs with visual effect indicators
 */
function renderOrbs(ctx: CanvasRenderingContext2D, orbs: any[], activeEffects: any[], colors: any): void {
	//
	orbs.forEach((orb) => {
		//
		// draw main orb body
		ctx.beginPath();
		ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
		ctx.fillStyle = colors[orb.color as keyof typeof colors];
		ctx.fill();

		// determine active effects for this orb
		const now = Date.now();
		const orbHasSpeedBoost = hasSpeedBoost(orb, activeEffects);
		const orbIsFrozen = isOrbFrozen(orb, activeEffects);

		// draw effect indicators as colored outlines
		if (orbHasSpeedBoost) {
			//
			drawEffectOutline(ctx, orb, colors.speedBoost, [5, 5], 3);
		} else if (orbIsFrozen) {
			//
			drawEffectOutline(ctx, orb, colors.frozen, [2, 2], 3);
		} else {
			//
			// default outline
			const outlineColor = orb.color === 'black' ? colors.white : colors.black;
			drawEffectOutline(ctx, orb, outlineColor, [], 2);
		}

		// draw temporary orb indicator
		if (orb.isTemporary) {
			//
			drawEffectOutline(ctx, orb, colors.temporary, [3, 3], 2, 3);
		}
	});
}

/**
 * draws an effect outline around an orb
 */
function drawEffectOutline(
	ctx: CanvasRenderingContext2D,
	orb: any,
	color: string,
	dashPattern: number[],
	lineWidth: number,
	radiusOffset: number = 0,
): void {
	//
	ctx.beginPath();
	ctx.arc(orb.x, orb.y, orb.radius + radiusOffset, 0, Math.PI * 2);
	ctx.strokeStyle = color;
	ctx.lineWidth = lineWidth;
	ctx.setLineDash(dashPattern);
	ctx.stroke();
	ctx.setLineDash([]); // reset line dash
}
