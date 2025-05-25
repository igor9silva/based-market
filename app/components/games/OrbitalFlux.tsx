import { Play, RotateCcw, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';

type Color = 'black' | 'white' | 'neutral';

interface Orb {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: Color;
	radius: number;
}

interface ActiveEffect {
	type: string;
	side: Color;
	endTime: number;
	id: string;
}

interface TempOrb extends Orb {
	isTemporary?: boolean;
	endTime?: number;
}

interface GameConfig {
	gridWidth: number;
	gridHeight: number;
	orbSpeed: number;
	winThreshold: number;
	blockSize: number;
}

interface GameState {
	grid: Color[][];
	orbs: TempOrb[];
	blackCount: number;
	whiteCount: number;
	isRunning: boolean;
	winner: string | null;
	animationId: number | null;
	activeEffects: ActiveEffect[];
}

export default function OrbitalFlux() {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const animationRef = useRef<number>();

	const [config, setConfig] = useState<GameConfig>({
		gridWidth: 50,
		gridHeight: 50,
		orbSpeed: 20,
		winThreshold: 90,
		blockSize: 12,
	});

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

	// Initialize the game board
	const initializeGame = useCallback(() => {
		const { gridWidth, gridHeight, orbSpeed, blockSize } = config;

		// Create initial grid with 50/50 split (left white, right black)
		const grid: ('black' | 'white')[][] = [];
		const splitPoint = Math.floor(gridWidth / 2);

		for (let y = 0; y < gridHeight; y++) {
			grid[y] = [];
			for (let x = 0; x < gridWidth; x++) {
				grid[y][x] = x < splitPoint ? 'white' : 'black';
			}
		}

		// Create orbs with random initial directions
		const whiteOrb: Orb = {
			x: (splitPoint / 2) * blockSize + blockSize / 2,
			y: (gridHeight / 2) * blockSize + blockSize / 2,
			vx: (Math.random() - 0.5) * orbSpeed * 2,
			vy: (Math.random() - 0.5) * orbSpeed * 2,
			color: 'white',
			radius: blockSize * 0.4,
		};

		const blackOrb: Orb = {
			x: (splitPoint + (gridWidth - splitPoint) / 2) * blockSize + blockSize / 2,
			y: (gridHeight / 2) * blockSize + blockSize / 2,
			vx: (Math.random() - 0.5) * orbSpeed * 2,
			vy: (Math.random() - 0.5) * orbSpeed * 2,
			color: 'black',
			radius: blockSize * 0.4,
		};

		// Ensure orbs have minimum speed
		const minSpeed = orbSpeed * 0.5;
		if (Math.abs(whiteOrb.vx) + Math.abs(whiteOrb.vy) < minSpeed) {
			whiteOrb.vx = orbSpeed;
			whiteOrb.vy = 0;
		}
		if (Math.abs(blackOrb.vx) + Math.abs(blackOrb.vy) < minSpeed) {
			blackOrb.vx = -orbSpeed;
			blackOrb.vy = 0;
		}

		const blackCount = grid.flat().filter((cell) => cell === 'black').length;
		const whiteCount = grid.flat().filter((cell) => cell === 'white').length;

		setGameState({
			grid,
			orbs: [whiteOrb, blackOrb],
			blackCount,
			whiteCount,
			isRunning: false,
			winner: null,
			animationId: null,
			activeEffects: [],
		});
	}, [config]);

	const hasActiveEffect = (effectType: string, side: string) => {
		return gameState.activeEffects.some((effect) => effect.type === effectType && effect.side === side);
	};

	const activateEffect = (effectType: string, side: Color) => {
		if (!gameState.isRunning) return;

		const now = Date.now();
		const duration =
			effectType === 'freeze-opponent'
				? 5000
				: effectType === 'chaos-mode'
					? 6000
					: effectType === 'speed-boost'
						? 8000
						: 10000;

		const newEffect: ActiveEffect = {
			type: effectType,
			side,
			endTime: now + duration,
			id: `${effectType}-${side}-${now}`,
		};

		setGameState((prevState) => {
			const newState = { ...prevState };

			// Add the effect
			newState.activeEffects = [...prevState.activeEffects, newEffect];

			// Apply immediate effect
			if (effectType === 'extra-orb') {
				const { gridWidth, gridHeight, blockSize, orbSpeed } = config;
				const isBlack = side === 'black';

				// Find a random position in the team's territory
				const teamBlocks = [];
				for (let y = 0; y < gridHeight; y++) {
					for (let x = 0; x < gridWidth; x++) {
						if (newState.grid[y][x] === side) {
							teamBlocks.push({ x, y });
						}
					}
				}

				if (teamBlocks.length > 0) {
					const randomBlock = teamBlocks[Math.floor(Math.random() * teamBlocks.length)];
					const tempOrb: TempOrb = {
						x: randomBlock.x * blockSize + blockSize / 2,
						y: randomBlock.y * blockSize + blockSize / 2,
						vx: (Math.random() - 0.5) * orbSpeed * 2,
						vy: (Math.random() - 0.5) * orbSpeed * 2,
						color: side,
						radius: blockSize * 0.35,
						isTemporary: true,
						endTime: now + duration,
					};

					// Ensure minimum speed
					const minSpeed = orbSpeed * 0.5;
					if (Math.abs(tempOrb.vx) + Math.abs(tempOrb.vy) < minSpeed) {
						tempOrb.vx = isBlack ? -orbSpeed : orbSpeed;
						tempOrb.vy = 0;
					}

					newState.orbs = [...newState.orbs, tempOrb];
				}
			} else if (effectType === 'chaos-mode') {
				// Randomize all orb directions
				newState.orbs = newState.orbs.map((orb) => ({
					...orb,
					vx: (Math.random() - 0.5) * config.orbSpeed * 3,
					vy: (Math.random() - 0.5) * config.orbSpeed * 3,
				}));
			}

			return newState;
		});
	};

	// Improved collision detection with ray-casting
	const checkBlockCollision = (orb: TempOrb, grid: Color[][], prevX: number, prevY: number) => {
		const { gridWidth, gridHeight, blockSize } = config;

		// Calculate the movement vector
		const dx = orb.x - prevX;
		const dy = orb.y - prevY;
		const distance = Math.sqrt(dx * dx + dy * dy);

		if (distance === 0) return false;

		// Normalize the direction vector
		const dirX = dx / distance;
		const dirY = dy / distance;

		// Step along the path in small increments
		const stepSize = Math.min(blockSize / 4, distance / 10); // Ensure we don't miss any blocks
		const steps = Math.ceil(distance / stepSize);

		for (let step = 0; step <= steps; step++) {
			const checkX = prevX + dirX * stepSize * step;
			const checkY = prevY + dirY * stepSize * step;

			// Don't check beyond the current position
			if (step * stepSize > distance) {
				break;
			}

			const gridX = Math.floor(checkX / blockSize);
			const gridY = Math.floor(checkY / blockSize);

			if (gridX >= 0 && gridX < gridWidth && gridY >= 0 && gridY < gridHeight) {
				const blockColor = grid[gridY][gridX];

				// Only convert if it's the opposing color
				if (blockColor !== orb.color) {
					// Check if the block's color has unbreakable effect
					const hasUnbreakable = gameState.activeEffects.some(
						(effect) =>
							effect.type === 'unbreakable' && effect.side === blockColor && effect.endTime > Date.now(),
					);

					// Calculate precise collision point and normal
					const blockLeft = gridX * blockSize;
					const blockRight = (gridX + 1) * blockSize;
					const blockTop = gridY * blockSize;
					const blockBottom = (gridY + 1) * blockSize;

					// Find which edge of the block we hit first
					const hitEdge = '';
					const collisionX = checkX;
					const collisionY = checkY;

					// Calculate intersection with each edge
					const intersections = [];

					// Left edge
					if (dirX > 0) {
						const t = (blockLeft - prevX) / dirX;
						const y = prevY + dirY * t;
						if (t >= 0 && t <= distance / Math.abs(dirX) && y >= blockTop && y <= blockBottom) {
							intersections.push({ t, edge: 'left', x: blockLeft, y });
						}
					}

					// Right edge
					if (dirX < 0) {
						const t = (blockRight - prevX) / dirX;
						const y = prevY + dirY * t;
						if (t >= 0 && t <= distance / Math.abs(dirX) && y >= blockTop && y <= blockBottom) {
							intersections.push({ t, edge: 'right', x: blockRight, y });
						}
					}

					// Top edge
					if (dirY > 0) {
						const t = (blockTop - prevY) / dirY;
						const x = prevX + dirX * t;
						if (t >= 0 && t <= distance / Math.abs(dirY) && x >= blockLeft && x <= blockRight) {
							intersections.push({ t, edge: 'top', x, y: blockTop });
						}
					}

					// Bottom edge
					if (dirY < 0) {
						const t = (blockBottom - prevY) / dirY;
						const x = prevX + dirX * t;
						if (t >= 0 && t <= distance / Math.abs(dirY) && x >= blockLeft && x <= blockRight) {
							intersections.push({ t, edge: 'bottom', x, y: blockBottom });
						}
					}

					// Find the closest intersection
					if (intersections.length > 0) {
						const closest = intersections.reduce((min, curr) => (curr.t < min.t ? curr : min));

						// Position orb at collision point
						orb.x = closest.x;
						orb.y = closest.y;

						// Reflect based on which edge was hit
						if (closest.edge === 'left' || closest.edge === 'right') {
							orb.vx = -orb.vx;
						} else {
							orb.vy = -orb.vy;
						}

						// Convert block if not unbreakable
						if (!hasUnbreakable) {
							grid[gridY][gridX] = orb.color;
						}

						return true;
					}
				}
			}
		}
		return false;
	};

	// Check collision with canvas boundaries
	const checkBoundaryCollision = (orb: Orb) => {
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
	};

	// Animation loop
	const animate = useCallback(() => {
		setGameState((prevState) => {
			if (!prevState.isRunning || prevState.winner) return prevState;

			const now = Date.now();

			// Clean up expired effects and temporary orbs
			const activeEffects = prevState.activeEffects.filter((effect) => effect.endTime > now);
			const orbs = prevState.orbs.filter((orb) => !orb.isTemporary || (orb.endTime && orb.endTime > now));

			const newGrid = prevState.grid.map((row) => [...row]);
			const newOrbs = orbs.map((orb) => ({ ...orb }));

			// Apply speed modifications and freeze effects
			newOrbs.forEach((orb) => {
				// Store previous position for collision detection
				const prevX = orb.x;
				const prevY = orb.y;

				// Check if orb is frozen
				const isFrozen = activeEffects.some(
					(effect) =>
						effect.type === 'freeze-opponent' &&
						((effect.side === 'white' && orb.color === 'black') ||
							(effect.side === 'black' && orb.color === 'white')) &&
						effect.endTime > now,
				);

				if (isFrozen) return; // Skip movement for frozen orbs

				// Apply speed boost
				const hasSpeedBoost = activeEffects.some(
					(effect) => effect.type === 'speed-boost' && effect.side === orb.color && effect.endTime > now,
				);

				const speedMultiplier = hasSpeedBoost ? 2 : 1;

				// Move orb with speed modification
				orb.x += orb.vx * speedMultiplier;
				orb.y += orb.vy * speedMultiplier;

				// Check boundary collisions first
				checkBoundaryCollision(orb);

				// Check block collisions with previous position
				checkBlockCollision(orb, newGrid, prevX, prevY);
			});

			// Count territories
			const blackCount = newGrid.flat().filter((cell) => cell === 'black').length;
			const whiteCount = newGrid.flat().filter((cell) => cell === 'white').length;
			const totalBlocks = blackCount + whiteCount;

			// Check win conditions
			let winner = null;
			const blackPercentage = (blackCount / totalBlocks) * 100;
			const whitePercentage = (whiteCount / totalBlocks) * 100;

			if (blackPercentage >= config.winThreshold) {
				winner = `Black wins with ${blackPercentage.toFixed(1)}%!`;
			} else if (whitePercentage >= config.winThreshold) {
				winner = `White wins with ${whitePercentage.toFixed(1)}%!`;
			} else if (blackCount === 0) {
				winner = 'White wins with total domination!';
			} else if (whiteCount === 0) {
				winner = 'Black wins with total domination!';
			}

			return {
				...prevState,
				grid: newGrid,
				orbs: newOrbs,
				blackCount,
				whiteCount,
				winner,
				isRunning: !winner,
				activeEffects,
			};
		});

		if (gameState.isRunning && !gameState.winner) {
			animationRef.current = requestAnimationFrame(animate);
		}
	}, [config, gameState.isRunning, gameState.winner, gameState.activeEffects]);

	// Render the game
	const render = useCallback(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const { gridWidth, gridHeight, blockSize } = config;

		// Clear canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		// Draw grid
		gameState.grid.forEach((row, y) => {
			row.forEach((cell, x) => {
				ctx.fillStyle = cell === 'black' ? '#000000' : '#ffffff';
				ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

				// Draw grid lines
				ctx.strokeStyle = '#666666';
				ctx.lineWidth = 0.5;
				ctx.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
			});
		});

		// Draw orbs with effect indicators
		gameState.orbs.forEach((orb) => {
			// Draw orb
			ctx.beginPath();
			ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
			ctx.fillStyle = orb.color === 'black' ? '#000000' : '#ffffff';
			ctx.fill();

			// Check for active effects
			const hasSpeedBoost = gameState.activeEffects.some(
				(effect) => effect.type === 'speed-boost' && effect.side === orb.color && effect.endTime > Date.now(),
			);
			const isFrozen = gameState.activeEffects.some(
				(effect) =>
					effect.type === 'freeze-opponent' &&
					((effect.side === 'white' && orb.color === 'black') ||
						(effect.side === 'black' && orb.color === 'white')) &&
					effect.endTime > Date.now(),
			);

			// Draw effect indicators
			if (hasSpeedBoost) {
				ctx.strokeStyle = '#ff6b35';
				ctx.lineWidth = 3;
				ctx.setLineDash([5, 5]);
			} else if (isFrozen) {
				ctx.strokeStyle = '#00bcd4';
				ctx.lineWidth = 3;
				ctx.setLineDash([2, 2]);
			} else {
				ctx.strokeStyle = orb.color === 'black' ? '#ffffff' : '#000000';
				ctx.lineWidth = 2;
				ctx.setLineDash([]);
			}
			ctx.stroke();
			ctx.setLineDash([]); // Reset line dash

			// Draw temporary orb indicator
			if (orb.isTemporary) {
				ctx.beginPath();
				ctx.arc(orb.x, orb.y, orb.radius + 3, 0, Math.PI * 2);
				ctx.strokeStyle = '#ffd700';
				ctx.lineWidth = 2;
				ctx.setLineDash([3, 3]);
				ctx.stroke();
				ctx.setLineDash([]);
			}
		});
	}, [config, gameState.grid, gameState.orbs, gameState.activeEffects]);

	// Start/stop simulation
	const toggleSimulation = () => {
		if (gameState.isRunning) {
			setGameState((prev) => ({ ...prev, isRunning: false }));
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		} else {
			setGameState((prev) => ({ ...prev, isRunning: true, winner: null }));
		}
	};

	// Reset simulation
	const resetSimulation = () => {
		if (animationRef.current) {
			cancelAnimationFrame(animationRef.current);
		}
		initializeGame();
	};

	// Initialize game on mount and config changes
	useEffect(() => {
		initializeGame();
	}, [initializeGame]);

	// Start animation when running
	useEffect(() => {
		if (gameState.isRunning && !gameState.winner) {
			animationRef.current = requestAnimationFrame(animate);
		}
		return () => {
			if (animationRef.current) {
				cancelAnimationFrame(animationRef.current);
			}
		};
	}, [gameState.isRunning, animate]);

	// Render on state changes
	useEffect(() => {
		render();
	}, [render]);

	const totalBlocks = gameState.blackCount + gameState.whiteCount;
	const blackPercentage = totalBlocks > 0 ? (gameState.blackCount / totalBlocks) * 100 : 0;
	const whitePercentage = totalBlocks > 0 ? (gameState.whiteCount / totalBlocks) * 100 : 0;

	return (
		<div className="min-h-screen bg-gray-100 p-4">
			<div className="max-w-6xl mx-auto">
				<div className="text-center mb-6">
					<h1 className="text-4xl font-bold text-gray-800 mb-2">Orbital Flux</h1>
					<p className="text-gray-600">Autonomous territorial simulation with dynamic orb physics</p>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* Game Canvas */}
					<div className="lg:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center justify-between">
									<span>Simulation Arena</span>
									<div className="flex gap-2">
										<Button
											onClick={toggleSimulation}
											variant={gameState.isRunning ? 'destructive' : 'default'}
											size="sm"
										>
											{gameState.isRunning ? (
												<Square className="w-4 h-4" />
											) : (
												<Play className="w-4 h-4" />
											)}
											{gameState.isRunning ? 'Stop' : 'Start'}
										</Button>
										<Button onClick={resetSimulation} variant="outline" size="sm">
											<RotateCcw className="w-4 h-4" />
											Reset
										</Button>
									</div>
								</CardTitle>
							</CardHeader>
							<CardContent>
								<div className="flex justify-center">
									<canvas
										ref={canvasRef}
										width={config.gridWidth * config.blockSize}
										height={config.gridHeight * config.blockSize}
										className="border border-gray-300 bg-white"
									/>
								</div>

								{gameState.winner && (
									<div className="mt-4 p-4 bg-yellow-100 border border-yellow-300 rounded-lg text-center">
										<h3 className="text-lg font-bold text-yellow-800">{gameState.winner}</h3>
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Controls and Stats */}
					<div className="space-y-6">
						{/* Territory Control */}
						<Card>
							<CardHeader>
								<CardTitle>Territory Control</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="flex items-center gap-2">
											<div className="w-4 h-4 bg-white border border-black"></div>
											White
										</span>
										<span className="font-mono">{whitePercentage.toFixed(1)}%</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-3">
										<div
											className="bg-white border border-gray-400 h-3 rounded-full transition-all duration-300"
											style={{ width: `${whitePercentage}%` }}
										></div>
									</div>
								</div>

								<div className="space-y-2">
									<div className="flex justify-between items-center">
										<span className="flex items-center gap-2">
											<div className="w-4 h-4 bg-black"></div>
											Black
										</span>
										<span className="font-mono">{blackPercentage.toFixed(1)}%</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-3">
										<div
											className="bg-black h-3 rounded-full transition-all duration-300"
											style={{ width: `${blackPercentage}%` }}
										></div>
									</div>
								</div>
							</CardContent>
						</Card>

						{/* Power-Up Actions */}
						<Card>
							<CardHeader>
								<CardTitle>Power-Up Actions</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<h4 className="font-semibold text-sm">White Team</h4>
									<div className="grid grid-cols-1 gap-2">
										<Button
											onClick={() => activateEffect('extra-orb', 'white')}
											disabled={!gameState.isRunning || hasActiveEffect('extra-orb', 'white')}
											size="sm"
											variant="outline"
										>
											Extra Orb (10s)
										</Button>
										<Button
											onClick={() => activateEffect('unbreakable', 'white')}
											disabled={!gameState.isRunning || hasActiveEffect('unbreakable', 'white')}
											size="sm"
											variant="outline"
										>
											Unbreakable (10s)
										</Button>
										<Button
											onClick={() => activateEffect('speed-boost', 'white')}
											disabled={!gameState.isRunning || hasActiveEffect('speed-boost', 'white')}
											size="sm"
											variant="outline"
										>
											Speed Boost (8s)
										</Button>
										<Button
											onClick={() => activateEffect('freeze-opponent', 'white')}
											disabled={
												!gameState.isRunning || hasActiveEffect('freeze-opponent', 'white')
											}
											size="sm"
											variant="outline"
										>
											Freeze Black (5s)
										</Button>
									</div>
								</div>

								<div className="space-y-2">
									<h4 className="font-semibold text-sm">Black Team</h4>
									<div className="grid grid-cols-1 gap-2">
										<Button
											onClick={() => activateEffect('extra-orb', 'black')}
											disabled={!gameState.isRunning || hasActiveEffect('extra-orb', 'black')}
											size="sm"
											variant="outline"
										>
											Extra Orb (10s)
										</Button>
										<Button
											onClick={() => activateEffect('unbreakable', 'black')}
											disabled={!gameState.isRunning || hasActiveEffect('unbreakable', 'black')}
											size="sm"
											variant="outline"
										>
											Unbreakable (10s)
										</Button>
										<Button
											onClick={() => activateEffect('speed-boost', 'black')}
											disabled={!gameState.isRunning || hasActiveEffect('speed-boost', 'black')}
											size="sm"
											variant="outline"
										>
											Speed Boost (8s)
										</Button>
										<Button
											onClick={() => activateEffect('freeze-opponent', 'black')}
											disabled={
												!gameState.isRunning || hasActiveEffect('freeze-opponent', 'black')
											}
											size="sm"
											variant="outline"
										>
											Freeze White (5s)
										</Button>
									</div>
								</div>

								<Button
									onClick={() => activateEffect('chaos-mode', 'neutral')}
									disabled={!gameState.isRunning || hasActiveEffect('chaos-mode', 'neutral')}
									size="sm"
									variant="destructive"
									className="w-full"
								>
									🌪️ Chaos Mode (6s)
								</Button>

								{gameState.activeEffects.length > 0 && (
									<div className="mt-4 p-3 bg-blue-50 rounded-lg">
										<h5 className="font-semibold text-sm mb-2">Active Effects:</h5>
										{gameState.activeEffects.map((effect) => (
											<div key={effect.id} className="text-xs text-blue-700">
												{effect.side !== 'neutral' ? `${effect.side.toUpperCase()}: ` : ''}
												{effect.type.replace('-', ' ').toUpperCase()}(
												{Math.max(0, Math.ceil((effect.endTime - Date.now()) / 1000))}s)
											</div>
										))}
									</div>
								)}
							</CardContent>
						</Card>

						{/* Configuration */}
						<Card>
							<CardHeader>
								<CardTitle>Configuration</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<Label>
										Grid Size: {config.gridWidth}×{config.gridHeight}
									</Label>
									<Slider
										value={[config.gridWidth]}
										onValueChange={([value]) =>
											setConfig((prev) => ({ ...prev, gridWidth: value, gridHeight: value }))
										}
										min={20}
										max={60}
										step={5}
										disabled={gameState.isRunning}
									/>
								</div>

								<div className="space-y-2">
									<Label>Orb Speed: {config.orbSpeed}</Label>
									<Slider
										value={[config.orbSpeed]}
										onValueChange={([value]) => setConfig((prev) => ({ ...prev, orbSpeed: value }))}
										min={1}
										max={50}
										step={1}
										disabled={gameState.isRunning}
									/>
								</div>

								<div className="space-y-2">
									<Label>Win Threshold: {config.winThreshold}%</Label>
									<Slider
										value={[config.winThreshold]}
										onValueChange={([value]) =>
											setConfig((prev) => ({ ...prev, winThreshold: value }))
										}
										min={60}
										max={99}
										step={5}
										disabled={gameState.isRunning}
									/>
								</div>

								<div className="space-y-2">
									<Label>Block Size: {config.blockSize}px</Label>
									<Slider
										value={[config.blockSize]}
										onValueChange={([value]) =>
											setConfig((prev) => ({ ...prev, blockSize: value }))
										}
										min={8}
										max={20}
										step={2}
										disabled={gameState.isRunning}
									/>
								</div>
							</CardContent>
						</Card>

						{/* Stats */}
						<Card>
							<CardHeader>
								<CardTitle>Statistics</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2">
								<div className="flex justify-between">
									<span>Total Blocks:</span>
									<span className="font-mono">{totalBlocks}</span>
								</div>
								<div className="flex justify-between">
									<span>White Blocks:</span>
									<span className="font-mono">{gameState.whiteCount}</span>
								</div>
								<div className="flex justify-between">
									<span>Black Blocks:</span>
									<span className="font-mono">{gameState.blackCount}</span>
								</div>
								<div className="flex justify-between">
									<span>Status:</span>
									<span
										className={`font-mono ${gameState.isRunning ? 'text-green-600' : 'text-red-600'}`}
									>
										{gameState.isRunning ? 'Running' : 'Stopped'}
									</span>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
