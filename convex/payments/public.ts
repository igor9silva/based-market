import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { httpAction } from '../_generated/server';
import { action, mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { productSchema } from '../schemas/paymentSchema';
import { createConfirmed, createPayment, finishPayment, setPendingPayment } from './private';
import { parseAndVerifyCoinbaseEvent, PayloadParseError, SignatureVerificationError } from './webhooks';

export const byCoinbaseId = query({
	args: {
		coinbaseId: z.string(),
	},
	handler: async (ctx, { coinbaseId }) => {
		return ctx.db
			.query('payments')
			.withIndex('by_coinbaseId', (q) => q.eq('coinbaseId', coinbaseId))
			.unique();
	},
});

export const all = query({
	args: {
		gameId: zid('games'),
	},
	handler: async (ctx, { gameId }) => {
		return ctx.db
			.query('payments')
			.withIndex('by_gameId', (q) => q.eq('gameId', gameId))
			.order('desc')
			.take(10);
	},
});

export const notUsed = query({
	args: {
		gameId: zid('games'),
	},
	handler: async (ctx, { gameId }) => {
		return ctx.db
			.query('payments')
			.withIndex('by_gameId', (q) => q.eq('gameId', gameId))
			.filter((q) =>
				q.and(
					q.eq(q.field('isUsed'), false),
					q.or(q.eq(q.field('status'), 'pending'), q.eq(q.field('status'), 'confirmed')),
				),
			)
			.order('desc')
			.collect();
	},
});

export const start = action({
	args: {
		gameId: zid('games'),
		product: productSchema,
	},
	handler: async (ctx, { product, gameId }) => {
		//
		if (env.USE_FAKE_PAYMENTS === 'true') {
			//
			await ctx.runMutation(internal.payments.private.createConfirmed, {
				product,
				coinbaseId: crypto.randomUUID(),
				gameId,
			});

			return 'https://igorsilva.pro';
		}

		const response = await fetch('https://api.commerce.coinbase.com/charges', {
			method: 'POST',
			headers: {
				'X-CC-Api-Key': env.COINBASE_API_KEY,
				'Content-Type': 'application/json',
				'Accept': 'application/json',
			},
			body: JSON.stringify({
				pricing_type: 'fixed_price',
				redirect_url: `${env.SITE_URL}/games/orbital-flux`,
				local_price: {
					amount: '0.1',
					currency: 'USD',
				},
				metadata: {
					product,
					gameId,
				},
			}),
		});

		if (!response.ok) throw new Error('Failed to create charge');

		const json = await response.json();
		console.debug(`Coinbase charge created`, json);

		return json.data.hosted_url;
	},
});

export const markAsUsed = mutation({
	args: {
		paymentId: zid('payments'),
		password: z.string(),
	},
	handler: async (ctx, { paymentId, password }) => {
		//
		// verify password
		if (password !== env.LIVE_GAME_PASSWORD) {
			throw new Error('Invalid password');
		}

		await ctx.db.patch(paymentId, { isUsed: true });
	},
});

export const createAutoPayment = mutation({
	args: {
		gameId: zid('games'),
		password: z.string(),
	},
	handler: async (ctx, { gameId, password }) => {
		//
		// verify password
		if (password !== env.LIVE_GAME_PASSWORD) {
			throw new Error('Invalid password');
		}

		// get all valid products and select one randomly
		const validProducts = productSchema.options;
		const orbitalFluxProducts = validProducts.filter((p) => p.startsWith('orbital-flux '));
		const randomIndex = Math.floor(Math.random() * orbitalFluxProducts.length);
		const product = orbitalFluxProducts[randomIndex];

		// use the reusable createConfirmed function
		return await createConfirmed(ctx, {
			product,
			coinbaseId: `auto-${crypto.randomUUID()}`,
			gameId,
		});
	},
});

export const coinbaseWebhook = httpAction(async (ctx, request) => {
	//
	if (env.USE_FAKE_PAYMENTS === 'true') {
		console.debug('Using fake payments');
		return new Response(null, { status: 200 });
	}

	// return new Response(null, { status: 200 });
	try {
		const verifiedEvent = await parseAndVerifyCoinbaseEvent(request, env.COINBASE_WEBHOOK_SECRET);

		const { event } = webhookPayloadSchema.parse(verifiedEvent);
		const product = event.data.metadata.product;
		const gameId = event.data.metadata.gameId;
		const transferIntent = event.data.web3_data.transfer_intent;

		if (!product) {
			console.error('Coinbase webhook received without product', { event });
			return new Response(null, { status: 200 });
		}

		if (!gameId) {
			console.error('Coinbase webhook received without gameId', { event });
			return new Response(null, { status: 200 });
		}

		console.debug(`Coinbase '${event.type}' event (${event.data.id}) received:`, verifiedEvent);

		// prettier-ignore
		switch (event.type) {
			case 'charge:created': await createPayment(
				ctx,
				product,
				event.data.id,
				gameId as Id<'games'>,
				transferIntent?.metadata.sender,
				transferIntent?.metadata.chain_id,
				transferIntent?.metadata.contract_address,
			); break;
			case 'charge:pending': await setPendingPayment(ctx, event.data.id); break;
			case 'charge:failed': await finishPayment(ctx, event.data.id, 'failed'); break;
			case 'charge:confirmed': await finishPayment(ctx, event.data.id, 'confirmed'); break;
			default: console.debug(`Unhandled Coinbase '${event.type}' event received.`, { event });
		}

		return new Response(null, { status: 200 });
		//
	} catch (error) {
		//
		if (error instanceof SignatureVerificationError) {
			console.warn('Coinbase webhook signature verification failed', error);
			return new Response(null, { status: 403 });
		}

		if (error instanceof PayloadParseError) {
			console.warn('Coinbase webhook payload parse error', error);
			return new Response(null, { status: 400 });
		}

		console.error('Coinbase webhook error', error);
		return new Response(null, { status: 500 });
	}
});

const webhookPayloadSchema = z.object({
	id: z.string(),
	attempt_number: z.number(),
	scheduled_for: z.string(),
	event: z.object({
		type: z.enum([
			'charge:created', //
			'charge:pending',
			'charge:confirmed',
			'charge:failed',
		]),
		data: z.object({
			id: z.string(),
			metadata: z.object({
				product: productSchema.optional(),
				gameId: z.string().optional(),
			}),
			web3_data: z.object({
				transfer_intent: z
					.object({
						metadata: z.object({
							sender: z.string().optional(),
							chain_id: z.number().optional(),
							contract_address: z.string().optional(),
						}),
					})
					.optional()
					.nullable(),
			}),
		}),
	}),
});
