import { query } from '../../lib';
import { current as getCurrentUser } from '../public';
import { _preferencesForUser } from './private';

export const getPreferences = query({
	args: {},
	handler: async (ctx) => {
		//
		const user = await getCurrentUser(ctx, {});

		return await _preferencesForUser(ctx, { userId: user._id });
	},
});
