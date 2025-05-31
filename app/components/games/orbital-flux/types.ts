import { Id } from 'convex/_generated/dataModel';
import { perkTypeSchema } from 'convex/schemas/gameSchema';
import { ReactNode } from 'react';
import { z } from 'zod';
import type { GameConfig as BaseGameConfig, GameComponentProps } from '~/lib/games/GameRegistry';

export type Color = 'black' | 'white' | 'neutral';

export interface Orb {
	x: number;
	y: number;
	vx: number;
	vy: number;
	color: Color;
	radius: number;
}

export interface TempOrb {
	x: number;
	y: number;
	vx: number;
	vy: number;
	baseSpeed: number;
	baseDirection: { vx: number; vy: number };
	color: Color;
	radius: number;
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

export interface GameConfig extends BaseGameConfig {
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
	winner?: 'white' | 'black';
	animationId: number | null;
	activeEffects: ActiveEffect[];
	startTime?: number;
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

// extend the base game component props with orbital flux specific props
export interface OrbitalFluxProps extends GameComponentProps<GameConfig> {
	initialPerkConfig?: Partial<PerkConfig>;
	onTerritoryChange?: (stats: GameStats) => void;
}

export type EffectType = z.infer<typeof perkTypeSchema>;
