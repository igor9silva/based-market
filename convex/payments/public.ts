import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { api } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { ActionCtx, httpAction } from '../_generated/server';
import { action, mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { productSchema } from '../schemas/paymentSchema';
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
			.collect();
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
			const coinbaseId = crypto.randomUUID();
			await ctx.runMutation(api.payments.public.create, { product, coinbaseId, gameId });

			// auto-confirm after 3 seconds
			await ctx.scheduler.runAfter(3000, api.payments.public.finish, {
				coinbaseId,
				status: 'confirmed',
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

export const create = mutation({
	args: {
		product: productSchema,
		coinbaseId: z.string(),
		gameId: zid('games'),
	},
	handler: async (ctx, { product, coinbaseId, gameId }) => {
		await ctx.db.insert('payments', {
			product,
			coinbaseId,
			gameId,
			status: 'created',
			isUsed: false,
		});
	},
});

export const setPending = mutation({
	args: {
		coinbaseId: z.string(),
	},
	handler: async (ctx, { coinbaseId }) => {
		//
		const payment = await byCoinbaseId(ctx, { coinbaseId });
		if (!payment) throw new Error('Payment not found');

		await ctx.db.patch(payment._id, { status: 'pending' });
	},
});

export const finish = mutation({
	args: {
		coinbaseId: z.string(),
		status: z.enum(['confirmed', 'failed']),
	},
	handler: async (ctx, { coinbaseId, status }) => {
		//
		const payment = await byCoinbaseId(ctx, { coinbaseId });
		if (!payment) throw new Error('Payment not found');

		await ctx.db.patch(payment._id, { status });
	},
});

export const markAsUsed = mutation({
	args: {
		paymentId: zid('payments'),
	},
	handler: async (ctx, { paymentId }) => {
		//
		await ctx.db.patch(paymentId, { isUsed: true });
	},
});

function createPayment(
	ctx: ActionCtx,
	product: z.infer<typeof productSchema>,
	coinbaseId: string,
	gameId: Id<'games'>,
) {
	//
	return ctx.runMutation(api.payments.public.create, { product, coinbaseId, gameId });
}

function setPendingPayment(ctx: ActionCtx, coinbaseId: string) {
	//
	return ctx.runMutation(api.payments.public.setPending, { coinbaseId });
}

function finishPayment(ctx: ActionCtx, coinbaseId: string, status: 'confirmed' | 'failed') {
	//
	return ctx.runMutation(api.payments.public.finish, { coinbaseId, status });
}

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
			case 'charge:created': await createPayment(ctx, product, event.data.id, gameId as Id<'games'>); break;
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
		}),
	}),
});
