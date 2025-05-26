import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { gameKindsSchema, orbitalFluxConfigSchema, perkTypeSchema, teamsSchema } from '../schemas/gameSchema';

export const start = mutation({
	args: {
		kind: gameKindsSchema,
		config: orbitalFluxConfigSchema,
	},
	handler: async (ctx, { kind, config }) => {
		//
		return await ctx.db.insert('games', {
			kind,
			config,
			activePerks: [],
			status: 'running',
			startedAt: Date.now(),
		});
	},
});

export const finish = mutation({
	args: {
		gameId: zid('games'),
		winner: teamsSchema,
	},
	handler: async (ctx, { gameId, winner }) => {
		//
		const game = await ctx.db.get(gameId);
		if (!game) throw new Error('Game not found');

		await ctx.db.patch(gameId, {
			status: 'finished',
			winner,
			endedAt: Date.now(),
		});

		return gameId;
	},
});

export const get = query({
	args: {
		gameId: zid('games'),
	},
	handler: async (ctx, { gameId }) => {
		//
		return await ctx.db.get(gameId);
	},
});

export const getActivePerks = query({
	args: {
		gameId: zid('games'),
	},
	handler: async (ctx, { gameId }) => {
		//
		const game = await ctx.db.get(gameId);
		if (!game) return [];

		// return all perks - client will handle filtering expired ones
		return game.activePerks;
	},
});

export const activatePerk = mutation({
	args: {
		gameId: zid('games'),
		perkId: z.string(),
		type: perkTypeSchema,
		side: teamsSchema.or(z.literal('neutral')),
		activatedAt: z.number(),
		duration: z.number(),
		purchaseId: z.string(),
	},
	handler: async (ctx, { gameId, perkId, type, side, activatedAt, duration, purchaseId }) => {
		//
		const game = await ctx.db.get(gameId);
		if (!game) throw new Error('Game not found');

		const newPerk = {
			id: perkId,
			type,
			side,
			activatedAt,
			duration,
			purchaseId,
		};

		// add to active perks
		const updatedPerks = [...game.activePerks, newPerk];

		await ctx.db.patch(gameId, {
			activePerks: updatedPerks,
		});

		return newPerk;
	},
});

export const deactivatePerk = mutation({
	args: {
		gameId: zid('games'),
		perkId: z.string(),
	},
	handler: async (ctx, { gameId, perkId }) => {
		//
		const game = await ctx.db.get(gameId);
		if (!game) throw new Error('Game not found');

		// remove perk by id
		const updatedPerks = game.activePerks.filter((perk) => perk.id !== perkId);

		await ctx.db.patch(gameId, {
			activePerks: updatedPerks,
		});

		return perkId;
	},
});

// perk management is now handled client-side
// backend only stores game state and payment status
