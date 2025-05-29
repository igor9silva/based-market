import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const gameKindsSchema = z.enum([
	'orbital-flux', //
]);

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
	// owner: zid('users'),
	kind: gameKindsSchema,
	config: orbitalFluxConfigSchema,
	activePerks: z.array(activePerkSchema),
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
	runningGameSchema, //
	finishedGameSchema,
]);

export const liveGameSchema = z.object({
	gameId: zid('games'),
	kind: gameKindsSchema,
});
