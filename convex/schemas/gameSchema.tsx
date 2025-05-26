import { z } from 'zod';

export const gameKindsSchema = z.enum([
	'orbital-flux', //
]);

export const teamsSchema = z.enum([
	'white', //
	'black',
]);

const coreGameSchema = z.object({
	// owner: zid('users'),
	kind: gameKindsSchema,
});

const runningGameSchema = coreGameSchema.extend({
	status: z.literal('running'),
});

const finishedGameSchema = coreGameSchema.extend({
	status: z.literal('finished'),
	winner: teamsSchema,
	endedAt: z.number(),
});

export const gameSchema = z.discriminatedUnion('status', [
	runningGameSchema, //
	finishedGameSchema,
]);
