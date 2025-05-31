import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

/**
 * Defines the schema for a product identifier.
 * This is a string that is expected to be structured to encode information
 * about the game, side, and perk type.
 * Example structure: "{gameSlug}:{side}:{perkType}"
 *   - orbital-flux:white:extra-orb
 *   - orbital-flux:neutral:chaos
 */
export const productSchema = z.string();

export const paymentStatusSchema = z.enum([
	'created', //
	'pending',
	'confirmed',
	'failed',
]);

export const paymentSchema = z.object({
	gameId: zid('games'),
	coinbaseId: z.string(),
	product: productSchema,
	status: paymentStatusSchema,
	isUsed: z.boolean(),
});
