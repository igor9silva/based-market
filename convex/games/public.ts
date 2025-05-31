import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';
import { mutation, query } from '../lib';
import { env } from '../schemas/envSchema';
import { gameKindsSchema, perkTypeSchema, teamsSchema } from '../schemas/gameSchema';

/**
 * Starts a new game instance.
 * This function is generic and can start any game specified by `kind`.
 * The `config` parameter is of type `z.any()` to accommodate different
 * configuration structures for various game kinds.
 */
export const start = mutation({
	args: {
		kind: gameKindsSchema, // The kind of game to start (e.g., 'orbital-flux')
		config: z.any(), // Game-specific configuration object
	},
	handler: async (ctx, { kind, config }) => {
		//
		return await ctx.db.insert('games', {
			kind,
			config, // The configuration is stored as provided
			activePerks: [],
			status: 'running',
			startedAt: Date.now(),
		});
	},
});

/**
 * Starts a new live game (password protected).
 * Similar to `start`, this function is generic for `kind` and `config`.
 * It performs additional checks for live games, such as password verification
 * and ensuring only one live game of a specific kind runs at a time.
 */
export const startLive = mutation({
	args: {
		password: z.string(), // Password to authorize live game creation
		kind: gameKindsSchema, // The kind of game to start
		config: z.any(), // Game-specific configuration object
	},
	handler: async (ctx, { password, kind, config }) => {
		//
		// verify password
		if (password !== env.LIVE_GAME_PASSWORD) {
			throw new Error('Invalid password for live game creation');
		}

		// check if there's already a live game of this kind
		const existingLiveGame = await ctx.db
			.query('liveGames')
			.withIndex('by_kind', (q) => q.eq('kind', kind))
			.first();

		if (existingLiveGame) {
			throw new Error(`A live ${kind} game is already running. Stop it first.`);
		}

		const gameId = await start(ctx, { kind, config });

		// add to liveGames table
		await ctx.db.insert('liveGames', { gameId, kind });

		return gameId;
	},
});

export const finish = mutation({
	args: {
		gameId: zid('games'), // The ID of the game to finish
		winner: teamsSchema, // The winning team/player
	},
	handler: async (ctx, { gameId, winner }) => {
		//
		const game = await ctx.db.get(gameId);
		if (!game) throw new Error('Game not found');

		// Update the game's status to 'finished' and record the winner and end time.
		// This function is generic as it only relies on the gameId and winner,
		// not on game-specific config or state.
		await ctx.db.patch(gameId, {
			status: 'finished',
			winner,
			endedAt: Date.now(),
		});

		// if this game is in liveGames table, remove it
		const liveGameEntry = await ctx.db
			.query('liveGames')
			.filter((q) => q.eq(q.field('gameId'), gameId))
			.first();

		if (liveGameEntry) await ctx.db.delete(liveGameEntry._id);

		return gameId;
	},
});

/**
 * stops a live game without declaring a winner (password protected)
 */
export const stopLive = mutation({
	args: {
		password: z.string(),
	},
	handler: async (ctx, { password }) => {
		//
		// verify password
		if (password !== env.LIVE_GAME_PASSWORD) {
			throw new Error('Invalid password for live game management');
		}

		// get current live game
		const liveGameEntry = await ctx.db.query('liveGames').first();
		if (!liveGameEntry) throw new Error('No live game is currently running');

		// remove from liveGames table
		await ctx.db.delete(liveGameEntry._id);

		return liveGameEntry.gameId;
	},
});

/**
 * cleanup function to stop all running games (password protected)
 */
export const cleanupAll = mutation({
	args: {
		password: z.string(),
	},
	handler: async (ctx, { password }) => {
		//
		// verify password
		if (password !== env.LIVE_GAME_PASSWORD) {
			throw new Error('Invalid password for cleanup operation');
		}

		// get all live game entries
		const liveGameEntries = await ctx.db.query('liveGames').collect();

		// remove all live game entries
		for (const entry of liveGameEntries) {
			await ctx.db.delete(entry._id);
		}

		return { stoppedGames: liveGameEntries.length };
	},
});

/**
 * gets the current live game
 */
export const getCurrentLiveGame = query({
	args: {},
	handler: async (ctx) => {
		//
		const liveGameEntry = await ctx.db.query('liveGames').first();
		if (!liveGameEntry) return null;

		// return the actual game data
		return await ctx.db.get(liveGameEntry.gameId);
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
