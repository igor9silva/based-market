import { env } from '../schemas/envSchema';

import { z } from 'zod';
import { api } from '../_generated/api';
import { ActionCtx, httpAction } from '../_generated/server';
import { mutation, query } from '../lib';
import { productSchema } from '../schemas/paymentSchema';

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
	args: {},
	handler: async (ctx) => {
		return ctx.db.query('payments').collect();
	},
});

export const start = mutation({
	args: {
		// gameId: zid('games'),
		product: productSchema,
	},
	handler: async (ctx, { product }) => {
		//
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
				},
			}),
		});

		if (!response.ok) throw new Error('Failed to create charge');

		const json = await response.json();
		console.debug(`Coinbase charge created (${json.checkout.id}):`, json);

		return json.hosted_url;
	},
});

export const create = mutation({
	args: {
		product: productSchema,
		coinbaseId: z.string(),
	},
	handler: async (ctx, { product, coinbaseId }) => {
		await ctx.db.insert('payments', {
			product,
			coinbaseId,
			status: 'created',
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

function createPayment(ctx: ActionCtx, product: z.infer<typeof productSchema>, coinbaseId: string) {
	return ctx.runMutation(api.payments.public.create, { product, coinbaseId });
}

function setPendingPayment(ctx: ActionCtx, coinbaseId: string) {
	return ctx.runMutation(api.payments.public.setPending, { coinbaseId });
}

function finishPayment(ctx: ActionCtx, coinbaseId: string, status: 'confirmed' | 'failed') {
	return ctx.runMutation(api.payments.public.finish, { coinbaseId, status });
}

export const coinbaseWebhook = httpAction(async (ctx, request) => {
	//
	try {
		const signature = request.headers.get('X-CC-Webhook-Signature');
		if (!signature || signature !== env.COINBASE_WEBHOOK_SECRET) {
			console.warn('Coinbase webhook signature mismatch', signature);
			return new Response(null, { status: 403 });
		}

		const json = await request.json();
		console.debug('Coinbase webhook received', json);

		const { event } = webhookPayloadSchema.parse(json);
		const product = event.data.metadata.product;

		if (!product) {
			console.error('Coinbase webhook received without product', json);
			return new Response(null, { status: 200 });
		}

		// prettier-ignore
		switch (event.type) {
			//
			case 'charge:created': await createPayment(ctx, product, event.data.id); break;
			case 'charge:pending': await setPendingPayment(ctx, event.data.id); break;
			case 'charge:failed': await finishPayment(ctx, event.data.id, 'failed'); break;
			case 'charge:confirmed': await finishPayment(ctx, event.data.id, 'confirmed'); break;

			default: console.debug(`Unhandled Coinbase '${event.type}' event received.`, json);
		}

		return new Response(null, { status: 200 });
		//
	} catch (error) {
		//
		if (error instanceof PayloadParseError) {
			console.warn('Polar webhook payload parse error', error);
			return new Response(null, { status: 400 });
		}

		console.error('Polar webhook error', error);
		return new Response(null, { status: 500 });
	}
});

class PayloadParseError extends Error {
	constructor(message: string) {
		super(message);
		this.message = message;
	}
}

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
			}),
		}),
	}),
});
