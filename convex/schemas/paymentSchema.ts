import { z } from 'zod';

export const productSchema = z.enum([
	'orbital-flux white extra-orb',
	'orbital-flux white unbreakable',
	'orbital-flux white speed-boost',
	'orbital-flux white freeze-enemy',
	'orbital-flux black extra-orb',
	'orbital-flux black unbreakable',
	'orbital-flux black speed-boost',
	'orbital-flux black freeze-enemy',
	'orbital-flux neutral chaos',
]);

export const paymentStatusSchema = z.enum([
	'created', //
	'pending',
	'confirmed',
	'failed',
]);

export const paymentSchema = z.object({
	// gameId: zid('games'),
	coinbaseId: z.string(),
	product: productSchema,
	status: paymentStatusSchema,
});
