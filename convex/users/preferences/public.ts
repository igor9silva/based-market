import { z } from 'zod';
import { mutation, query } from '../../lib';
import { current as getCurrentUser } from '../public';
import { _getUserPreferece, _setUserPreference } from './private';

export const getPreference = query({
	args: {
		key: z.string(),
	},
	handler: async (ctx, { key }) => {
		//
		const user = await getCurrentUser(ctx, {});

		return await _getUserPreferece(ctx, { userId: user._id, key });
	},
});

export const setPreference = mutation({
	args: {
		key: z.string(),
		value: z.any(),
	},
	handler: async (ctx, { key, value }) => {
		//
		const user = await getCurrentUser(ctx, {});

		return await _setUserPreference(ctx, { userId: user._id, key, value });
	},
});
