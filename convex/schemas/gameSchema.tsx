import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

/**
 * Defines the available kinds of games.
 * This schema can be extended to support new game types in the future.
 * Example: z.enum(['orbital-flux', 'chess', 'tic-tac-toe']);
 */
export const gameKindsSchema = z.enum(['orbital-flux']);

export const teamsSchema = z.enum([
	'white', //
	'black',
]);

// orbital flux specific config schema
export const orbitalFluxConfigSchema = z.object({
	gridWidth: z.number().min(20).max(100),
	gridHeight: z.number().min(20).max(100),
	orbSpeed: z.number().min(1).max(50),
	winThreshold: z.number().min(51).max(100),
	blockSize: z.number().min(8).max(20),
});

// perk types for orbital flux
export const perkTypeSchema = z.enum(['extra-orb', 'unbreakable', 'speed-boost', 'freeze-enemy', 'chaos']);

// active perk schema
export const activePerkSchema = z.object({
	id: z.string(),
	type: perkTypeSchema,
	side: teamsSchema.or(z.literal('neutral')),
	activatedAt: z.number(),
	duration: z.number(), // in milliseconds
	purchaseId: z.string(), // reference to payment
});

const coreGameSchema = z.object({
	// owner: zid('users'), // TODO: Consider adding owner to games
	kind: gameKindsSchema, // The kind of game this schema represents
	/**
	 * Game-specific configuration.
	 * Stored as `z.any()` to allow flexibility for different game kinds.
	 * Each game kind will have its own specific config schema (e.g., orbitalFluxConfigSchema).
	 * Validation of this config should be handled by the game-specific logic.
	 */
	config: z.any(),
	activePerks: z.array(activePerkSchema), // List of perks currently active in the game
});

const runningGameSchema = coreGameSchema.extend({
	status: z.literal('running'),
	startedAt: z.number(),
});

const finishedGameSchema = coreGameSchema.extend({
	status: z.literal('finished'),
	winner: teamsSchema,
	startedAt: z.number(),
	endedAt: z.number(),
});

export const gameSchema = z.discriminatedUnion('status', [
	runningGameSchema,
	finishedGameSchema,
]);

/**
 * Represents a game that is currently marked as "live".
 * This is a separate document to quickly query for the current live game of a specific kind.
 */

export const liveGameSchema = z.object({
	gameId: zid('games'), // Reference to the actual game document in the 'games' table
	kind: gameKindsSchema, // The kind of game that is live (e.g., 'orbital-flux')
});
