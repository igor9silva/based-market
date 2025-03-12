import { z } from 'zod';
import { mutation, query } from '../../lib';
import { current as getCurrentUser } from '../public';
import { _preferencesForUser, _updateInboxDetailWidthPercent } from './private';

export const getPreferences = query({
	args: {},
	handler: async (ctx) => {
		//
		const user = await getCurrentUser(ctx, {});

		return await _preferencesForUser(ctx, { userId: user._id });
	},
});

export const updateInboxDetailWidthPercent = mutation({
	args: {
		widthPercent: z.number().min(0).max(100),
	},
	handler: async (ctx, { widthPercent }) => {
		//
		const user = await getCurrentUser(ctx, {});

		return await _updateInboxDetailWidthPercent(ctx, { userId: user._id, widthPercent });
	},
});
