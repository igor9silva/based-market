import type { GameConfig, PerkConfig } from './types';

// default game configuration
export const DEFAULT_GAME_CONFIG: GameConfig = {
	gridWidth: 20,
	gridHeight: 20,
	orbSpeed: 5,
	winThreshold: 55,
	blockSize: 12,
};

// default perk durations (in milliseconds)
export const DEFAULT_PERK_CONFIG: PerkConfig = {
	extraOrbDuration: 10000, // 10 seconds
	unbreakableDuration: 15000, // 15 seconds
	speedBoostDuration: 15000, // 15 seconds
	freezeDuration: 5000, // 5 seconds
	chaosModeDuration: 6000, // 6 seconds
};

// live mode configuration
export const LIVE_COUNTDOWN_DURATION = 10; // seconds between games in live mode

// configuration limits for sliders
export const CONFIG_LIMITS = {
	gridSize: { min: 20, max: 60, step: 5 },
	orbSpeed: { min: 1, max: 50, step: 1 },
	winThreshold: { min: 60, max: 99, step: 5 },
	blockSize: { min: 8, max: 20, step: 2 },
} as const;

// angle tolerance for avoiding right angles (in radians)
export const RIGHT_ANGLE_TOLERANCE = Math.PI / 12; // 15 degrees

// speed multipliers for effects
export const SPEED_MULTIPLIERS = {
	normal: 1,
	speedBoost: 2,
	chaosMode: 2,
} as const;
