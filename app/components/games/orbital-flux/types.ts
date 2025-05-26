import { Id } from 'convex/_generated/dataModel';
import { perkTypeSchema } from 'convex/schemas/gameSchema';
import { z } from 'zod';

export type Color = 'black' | 'white' | 'neutral';

export interface Orb {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: Color;
	radius: number;
}

export interface TempOrb extends Orb {
	isTemporary?: boolean;
	endTime?: number;
	lastMoveTime?: number;
	lastPosition?: { x: number; y: number };
}

export interface ActiveEffect {
	type: string;
	side: Color;
	endTime: number;
	id: string;
}

export interface GameConfig {
	gridWidth: number;
	gridHeight: number;
	orbSpeed: number;
	winThreshold: number;
	blockSize: number;
}

export interface GameState {
	grid: Color[][];
	orbs: TempOrb[];
	blackCount: number;
	whiteCount: number;
	isRunning: boolean;
	winner: string | null;
	animationId: number | null;
	activeEffects: ActiveEffect[];
}

export interface GameStats {
	totalBlocks: number;
	blackPercentage: number;
	whitePercentage: number;
}

export interface PerkConfig {
	extraOrbDuration: number;
	unbreakableDuration: number;
	speedBoostDuration: number;
	freezeDuration: number;
	chaosModeDuration: number;
}

export interface OrbitalFluxProps {
	// initial configuration options
	initialConfig?: Partial<GameConfig>;
	initialPerkConfig?: Partial<PerkConfig>;
	// backend integration
	gameId: Id<'games'>;
	// customization options
	enablePerks?: boolean;
	showStats?: boolean;
	// event callbacks
	onGameStart?: () => void;
	onGameStop?: () => void;
	onGameReset?: () => void;
	onWinner?: (winner: string) => void;
	onTerritoryChange?: (stats: GameStats) => void;
}

export type EffectType = z.infer<typeof perkTypeSchema>;
