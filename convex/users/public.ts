import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from '../lib';
import { _findOne } from './private';

export const current = query({
	args: {},
	handler: async (ctx) => {
		//
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const user = await _findOne(ctx, { userId });
		if (!user) throw new Error('Not found');

		const email = user.email;
		if (!email) throw new Error(`No email found for user ${userId}`);

		return user;
	},
});
